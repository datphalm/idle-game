import os
import sys
import time
import cv2
import numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor

BASE_DIR = os.path.abspath('.')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets', 'characters')

HERO_CONFIGS = {
    'trisa': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa2.mp4'),
        'crop_box': (20, 40, 870, 788),
        'target_w': 430,
        'target_h': 380,
        'actions': {
            'chibi_idle': {'start': 97, 'end': 137, 'step': 1, 'duration': 45},
            'chibi_walk': {'start': 418, 'end': 466, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 828, 'end': 864, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 1500, 'end': 1555, 'step': 1, 'duration': 40},
            'chibi_attack3': {'start': 1775, 'end': 1835, 'step': 1, 'duration': 42},
            'chibi_skill': {'start': 1073, 'end': 1165, 'step': 2, 'duration': 48},
            'chibi_hit': {'start': 978, 'end': 1030, 'step': 2, 'duration': 45}
        }
    },
    'hilde': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero1_hilde', 'hilde_chibi.mp4'),
        'crop_box': (20, 40, 870, 788),
        'target_w': 430,
        'target_h': 380,
        'actions': {
            'chibi_idle': {'start': 60, 'end': 160, 'step': 1, 'duration': 45},
            'chibi_walk': {'start': 240, 'end': 320, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 445, 'end': 525, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 560, 'end': 640, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 3525, 'end': 3615, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 3930, 'end': 4010, 'step': 1, 'duration': 45}
        }
    },
    'heide': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero2_heide', 'heide_chibi.mp4'),
        'crop_box': (20, 40, 870, 788),
        'target_w': 430,
        'target_h': 380,
        'actions': {
            'chibi_idle': {'start': 285, 'end': 352, 'step': 1, 'duration': 45},
            'chibi_walk': {'start': 730, 'end': 805, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 505, 'end': 580, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 845, 'end': 902, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 2260, 'end': 2345, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 395, 'end': 470, 'step': 1, 'duration': 45}
        }
    },
    'meilin': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero3_meilin', 'meilin_chibi.mp4'),
        'crop_box': (20, 40, 870, 788),
        'target_w': 430,
        'target_h': 380,
        'actions': {
            'chibi_idle': {'start': 60, 'end': 160, 'step': 1, 'duration': 45},
            'chibi_walk': {'start': 3270, 'end': 3360, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 640, 'end': 708, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 935, 'end': 998, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 3410, 'end': 3520, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 3670, 'end': 3760, 'step': 1, 'duration': 45}
        }
    }
}

def clean_frame(raw):
    out = raw.copy()
    out[:43, :] = 0
    out[788:, :] = 0
    out[:, :22] = 0
    out[:, 870:] = 0
    
    # Target only dropdown menu pixels in lower-right quadrant
    dd_roi = out[380:785, 665:870]
    gray_mask = (dd_roi[:,:,0] >= 20) & (dd_roi[:,:,0] <= 60) & \
                (dd_roi[:,:,1] >= 20) & (dd_roi[:,:,1] <= 60) & \
                (dd_roi[:,:,2] >= 20) & (dd_roi[:,:,2] <= 60)
    blue_mask = (dd_roi[:,:,0] > 140) & (dd_roi[:,:,2] < 110) & (dd_roi[:,:,1] > 40) & (dd_roi[:,:,1] < 215)
    dd_roi[gray_mask | blue_mask] = 0
    return out

def process_hero(hero_item):
    hero, cfg = hero_item
    t_h0 = time.time()
    print(f'=== Starting {hero} ===', flush=True)
    h_dir = os.path.join(ASSETS_DIR, hero)
    os.makedirs(h_dir, exist_ok=True)
    vpath = cfg['video_path']
    x1, y1, x2, y2 = cfg['crop_box']
    target_w, target_h = cfg['target_w'], cfg['target_h']

    cap = cv2.VideoCapture(vpath)
    for act_name, act in cfg['actions'].items():
        start, end, step, dur = act['start'], act['end'], act['step'], act['duration']
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        frames = []
        f_no = start
        while f_no <= end:
            ret, frame = cap.read()
            if not ret: break
            if (f_no - start) % step == 0:
                cleaned = clean_frame(frame)
                sub = cleaned[y1:y2, x1:x2]
                
                # Direct color threshold: pixels with color > 8 are foreground
                m = np.max(sub, axis=2)
                char_mask = (m > 8).astype(np.uint8) * 255
                
                # Filter stray noise specks (< 15px)
                num_l, labels, stats, _ = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
                clean_mask = np.zeros_like(char_mask)
                for lbl in range(1, num_l):
                    if stats[lbl, cv2.CC_STAT_AREA] >= 15:
                        clean_mask[labels == lbl] = 255
                
                # Zero out RGB where clean_mask == 0
                rgb = cv2.cvtColor(sub, cv2.COLOR_BGR2RGB)
                rgb[clean_mask == 0] = 0
                
                rgba = np.dstack([rgb, clean_mask])
                resized = cv2.resize(rgba, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
                
                # Border zeroing
                resized[0, :, 3] = 0
                resized[-1, :, 3] = 0
                resized[:, 0, 3] = 0
                resized[:, -1, 3] = 0
                
                # Zero out alpha for any dark background / fringe pixel (max(RGB) <= 8)
                # Guarantees ZERO black patches inside or outside!
                dark_mask = np.max(resized[:, :, :3], axis=2) <= 8
                resized[dark_mask, 3] = 0
                
                pil_im = Image.fromarray(resized, 'RGBA')
                frames.append(pil_im)
            f_no += 1
            
        if frames:
            out_path = os.path.join(h_dir, f'{act_name}.webp')
            frames[0].save(
                out_path,
                save_all=True,
                append_images=frames[1:],
                duration=dur,
                loop=0,
                lossless=True,
                quality=100,
                method=3
            )
            print(f'  Saved {hero}/{act_name}.webp ({len(frames)} frames)', flush=True)
    cap.release()
    elapsed = time.time() - t_h0
    print(f'=== Finished {hero} in {elapsed:.1f}s ===', flush=True)
    return hero, elapsed

if __name__ == '__main__':
    t0 = time.time()
    print('Starting concurrent rebuild of all 4 heroes with ZERO internal/external black patches...')
    items = list(HERO_CONFIGS.items())
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_hero, items))
    for h, el in results:
        print(f'Hero {h} done in {el:.1f}s')
    print(f'ALL 4 HEROES COMPLETED in {time.time()-t0:.1f}s! ZERO BLACK PATCHES!')

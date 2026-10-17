import os
import sys
import time
import cv2
import numpy as np
from PIL import Image, ImageOps
import shutil
from concurrent.futures import ProcessPoolExecutor

BASE_DIR = os.path.abspath('.')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets', 'characters')

HERO_CONFIGS = {
    'trisa': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa2.mp4'),
        'crop_box': (20, 40, 670, 788),
        'wipe_x': 670,
        'actions': {
            # New Standing Idle (stop) replacing the crouching/sitting pose!
            'chibi_idle': {'start': 3420, 'end': 3500, 'step': 1, 'duration': 40},
            'chibi_walk': {'start': 240, 'end': 320, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 445, 'end': 525, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 560, 'end': 640, 'step': 1, 'duration': 40},
            'chibi_attack3': {'start': 1000, 'end': 1080, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 3525, 'end': 3615, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 3930, 'end': 4010, 'step': 1, 'duration': 45}
        }
    },
    'meilin': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero3_meilin', 'meilin_chibi.mp4'),
        'crop_box': (20, 40, 670, 788),
        'wipe_x': 670,
        'actions': {
            # New Standing Graceful Idle (stop) replacing the vertical leg-split!
            'chibi_idle': {'start': 2380, 'end': 2460, 'step': 1, 'duration': 40},
            # Forward martial arts run/walk
            'chibi_walk': {'start': 1610, 'end': 1690, 'step': 1, 'duration': 40},
            # Rapid dual-fist martial arts punch combo
            'chibi_attack': {'start': 0, 'end': 70, 'step': 1, 'duration': 40},
            # Heavy wind-up dragon knuckle punch
            'chibi_attack2': {'start': 1160, 'end': 1240, 'step': 1, 'duration': 40},
            'chibi_attack3': {'start': 2660, 'end': 2740, 'step': 1, 'duration': 40},
            # Whirlwind dragon kick
            'chibi_skill': {'start': 3420, 'end': 3520, 'step': 2, 'duration': 46},
            # Recoil
            'chibi_hit': {'start': 3670, 'end': 3760, 'step': 1, 'duration': 45}
        }
    },
    'heide': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero2_heide', 'heide_chibi.mp4'),
        'crop_box': (20, 40, 670, 788),
        'wipe_x': 670,
        'actions': {
            'chibi_idle': {'start': 285, 'end': 352, 'step': 1, 'duration': 45},
            'chibi_walk': {'start': 730, 'end': 805, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 505, 'end': 580, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 845, 'end': 902, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 2260, 'end': 2345, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 395, 'end': 470, 'step': 1, 'duration': 45}
        }
    },
    'hilde': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero1_hilde', 'hilde_chibi.mp4'),
        'crop_box': (10, 40, 670, 788),
        'wipe_x': 670,
        'actions': {
            'chibi_idle': {'start': 80, 'end': 160, 'step': 1, 'duration': 45},
            'chibi_walk': {'start': 200, 'end': 280, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 340, 'end': 420, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 450, 'end': 530, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 2100, 'end': 2200, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 3900, 'end': 3980, 'step': 1, 'duration': 45}
        }
    }
}

def clean_frame(raw, wipe_x):
    out = raw.copy()
    out[:43, :] = 0
    out[788:, :] = 0
    out[:, :20] = 0
    if wipe_x:
        out[:, wipe_x:] = 0
    return out

def process_single_hero(hero_name):
    t_start = time.time()
    cfg = HERO_CONFIGS[hero_name]
    print(f'=== Starting {hero_name} (512x512 Proportional, Zero Distortion) ===', flush=True)
    out_dir = os.path.join(ASSETS_DIR, hero_name)
    os.makedirs(out_dir, exist_ok=True)
    vpath = cfg['video_path']
    x1, y1, x2, y2 = cfg['crop_box']
    wipe_x = cfg['wipe_x']

    cap = cv2.VideoCapture(vpath)
    canvas_size = 512

    for act_name, act in cfg['actions'].items():
        start, end, step, dur = act['start'], act['end'], act['step'], act['duration']
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        frames = []
        f_no = start
        while f_no <= end:
            ret, frame = cap.read()
            if not ret: break
            if (f_no - start) % step == 0:
                cleaned = clean_frame(frame, wipe_x)
                sub = cleaned[y1:y2, x1:x2]
                
                m = np.max(sub, axis=2)
                char_mask = (m > 8).astype(np.uint8) * 255
                
                num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
                clean_mask = np.zeros_like(char_mask)
                for lbl in range(1, num_labels):
                    if stats[lbl, cv2.CC_STAT_AREA] >= 20:
                        clean_mask[labels == lbl] = 255
                
                rgb = cv2.cvtColor(sub, cv2.COLOR_BGR2RGB)
                rgb[clean_mask == 0] = 0
                rgba = np.dstack([rgb, clean_mask])
                
                # UNIFORM PROPORTIONAL SCALING (sx == sy)
                h, w = rgba.shape[:2]
                scale = 496.0 / h
                new_w = int(w * scale)
                new_h = int(h * scale)
                
                resized = cv2.resize(rgba, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
                dark_mask = np.max(resized[:, :, :3], axis=2) <= 8
                resized[dark_mask, 3] = 0
                
                # Place onto 512x512 canvas centered horizontally, grounded near bottom
                canvas = np.zeros((canvas_size, canvas_size, 4), dtype=np.uint8)
                x_off = max(0, (canvas_size - new_w) // 2)
                y_off = max(0, canvas_size - new_h - 8)
                
                # Safe slice copy
                cw = min(new_w, canvas_size - x_off)
                ch = min(new_h, canvas_size - y_off)
                canvas[y_off:y_off+ch, x_off:x_off+cw] = resized[:ch, :cw]
                
                pil_im = Image.fromarray(canvas, 'RGBA')
                frames.append(pil_im)
            f_no += 1
            
        if frames:
            out_webp = os.path.join(out_dir, f'{act_name}.webp')
            frames[0].save(
                out_webp,
                save_all=True,
                append_images=frames[1:],
                duration=dur,
                loop=0,
                lossless=True,
                quality=100,
                method=3
            )
            out_png = os.path.join(out_dir, f'{act_name}.png')
            frames[0].save(out_png)
            print(f'  Saved {hero_name}/{act_name}.webp ({len(frames)} frames) and .png', flush=True)

    cap.release()
    elapsed = time.time() - t_start
    print(f'=== Finished {hero_name} in {elapsed:.1f}s ===', flush=True)
    return hero_name, elapsed

def sync_all():
    print('=== Syncing Rebuilt Proportional Assets ===', flush=True)
    for hero in ['trisa', 'meilin', 'heide', 'hilde']:
        src = os.path.join(ASSETS_DIR, hero)
        for dest in [
            os.path.join(BASE_DIR, 'server', 'static', 'assets', 'characters', hero),
            os.path.join(BASE_DIR, 'dist', 'assets', 'characters', hero)
        ]:
            os.makedirs(dest, exist_ok=True)
            for f in os.listdir(src):
                shutil.copy2(os.path.join(src, f), os.path.join(dest, f))
            print(f'Synced {hero} assets to {dest}', flush=True)

if __name__ == '__main__':
    t0 = time.time()
    heroes = ['trisa', 'meilin', 'heide', 'hilde']
    print('Starting concurrent rebuild of all 4 heroes with 512x512 uniform proportional scaling...')
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_single_hero, heroes))
    for h, el in results:
        print(f'Hero {h} finished in {el:.1f}s')
    sync_all()
    print(f'ALL 4 HEROES COMPLETED PERFECTLY in {time.time()-t0:.1f}s!')

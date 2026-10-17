import os
import sys
import time
import cv2
import numpy as np
from PIL import Image
import shutil
from concurrent.futures import ProcessPoolExecutor

BASE_DIR = os.path.abspath('.')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets', 'characters')

HERO_CONFIGS = {
    'trisa': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa2.mp4'),
        'x_ref': 455.0,
        'y_ground': 780.0,
        'wipe_x': 665,
        'left_cut': 30,
        'actions': {
            'chibi_idle': {'start': 3420, 'end': 3500, 'step': 1, 'duration': 40},
            'chibi_walk': {'start': 240, 'end': 320, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 445, 'end': 525, 'step': 1, 'duration': 42},
            'chibi_attack2': {'start': 560, 'end': 640, 'step': 1, 'duration': 40},
            # Tactical Dagger Throw & Spin Strike replacing the crate-sitting camping animation!
            'chibi_attack3': {'start': 3615, 'end': 3690, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 3525, 'end': 3615, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 3930, 'end': 4010, 'step': 1, 'duration': 45}
        }
    },
    'meilin': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero3_meilin', 'meilin_chibi.mp4'),
        'x_ref': 444.0,
        'y_ground': 785.0,
        'wipe_x': 670,
        'left_cut': 30,
        'actions': {
            'chibi_idle': {'start': 2380, 'end': 2460, 'step': 1, 'duration': 40},
            'chibi_walk': {'start': 1610, 'end': 1690, 'step': 1, 'duration': 40},
            'chibi_attack': {'start': 0, 'end': 70, 'step': 1, 'duration': 40},
            'chibi_attack2': {'start': 1160, 'end': 1240, 'step': 1, 'duration': 40},
            'chibi_attack3': {'start': 2660, 'end': 2740, 'step': 1, 'duration': 40},
            'chibi_skill': {'start': 3420, 'end': 3520, 'step': 2, 'duration': 46},
            'chibi_hit': {'start': 3670, 'end': 3760, 'step': 1, 'duration': 45}
        }
    },
    'heide': {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'raw_hero2_heide', 'heide_chibi.mp4'),
        'x_ref': 434.0,
        'y_ground': 785.0,
        'wipe_x': 670,
        'left_cut': 30,
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
        'x_ref': 436.0,
        'y_ground': 785.0,
        'wipe_x': None,  # Hilde has NO dropdown; zero right-edge clipping!
        'left_cut': 25,
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

SCALE = 0.55
CANVAS_SIZE = 512
ANCHOR_X = 256
ANCHOR_Y = 480

def process_single_hero(hero_name):
    t_start = time.time()
    cfg = HERO_CONFIGS[hero_name]
    print(f'=== Starting {hero_name} (512x512 Aura-Anchored, Zero Distortion) ===', flush=True)
    out_dir = os.path.join(ASSETS_DIR, hero_name)
    os.makedirs(out_dir, exist_ok=True)
    vpath = cfg['video_path']
    x_ref = cfg['x_ref']
    y_ground = cfg['y_ground']
    wipe_x = cfg['wipe_x']
    left_cut = cfg['left_cut']

    M = np.float32([
        [SCALE, 0, ANCHOR_X - x_ref * SCALE],
        [0, SCALE, ANCHOR_Y - y_ground * SCALE]
    ])

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
                clean = frame.copy()
                clean[:45, :] = 0
                clean[int(y_ground)+10:, :] = 0
                clean[:, :left_cut] = 0
                if wipe_x:
                    clean[:, wipe_x:] = 0

                m = (np.max(clean, axis=2) > 10).astype(np.uint8) * 255
                num, labels, stats, _ = cv2.connectedComponentsWithStats(m, 8)
                cmask = np.zeros_like(m)

                if num > 1:
                    main_lbl = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
                    cmask[labels == main_lbl] = 255
                    mx, my, mw, mh = stats[main_lbl, :4]
                    for i in range(1, num):
                        if i == main_lbl: continue
                        x, y, w, h, a = stats[i]
                        dist_x = max(0, mx - (x + w), x - (mx + mw))
                        dist_y = max(0, my - (y + h), y - (my + mh))
                        # Keep close components (sword, ribbons, arrows) but reject floating cursors
                        if a >= 200 or (dist_x <= 25 and dist_y <= 25 and a >= 30 and y < 650):
                            cmask[labels == i] = 255

                rgb = cv2.cvtColor(clean, cv2.COLOR_BGR2RGB)
                rgb[cmask == 0] = 0
                rgba = np.dstack([rgb, cmask])

                canvas = cv2.warpAffine(
                    rgba, M, (CANVAS_SIZE, CANVAS_SIZE),
                    flags=cv2.INTER_LANCZOS4,
                    borderMode=cv2.BORDER_CONSTANT,
                    borderValue=(0, 0, 0, 0)
                )

                # Pure transparency for dark boundary pixels
                dark = np.max(canvas[:, :, :3], axis=2) <= 8
                canvas[dark, 3] = 0

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
    print('=== Syncing Rebuilt Aura-Anchored Assets ===', flush=True)
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
    print('Starting concurrent rebuild of all 4 heroes with 512x512 Aura-Anchored scaling...')
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_single_hero, heroes))
    for h, el in results:
        print(f'Hero {h} finished in {el:.1f}s')
    sync_all()
    print(f'ALL 4 HEROES COMPLETED PERFECTLY in {time.time()-t0:.1f}s!')

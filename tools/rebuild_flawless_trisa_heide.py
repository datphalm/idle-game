import os
import sys
import time
import cv2
import numpy as np
from PIL import Image, ImageOps
import shutil

BASE_DIR = os.path.abspath('.')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets', 'characters')

def clean_frame_chibi(raw, hero):
    out = raw.copy()
    out[:43, :] = 0
    out[788:, :] = 0
    out[:, :22] = 0
    
    # In both Trisa and Heide, dropdown menu starts at x >= 670.
    # Trisa body max_x <= 669, Heide body max_x <= 659.
    # Wiping out[:, 670:] completely removes the dropdown menu, scrollbar, and text!
    if hero in ('trisa', 'heide'):
        out[:, 670:] = 0
    else:
        out[:, 870:] = 0
    return out

def rebuild_trisa_hover():
    print('=== Rebuilding Trisa 3D Hover & Bust/Full (100% Uncut, Zero Dropdown) ===', flush=True)
    vpath = os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa1.mp4')
    cap = cv2.VideoCapture(vpath)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames = []

    for fi in range(n):
        ret, frame = cap.read()
        if not ret: break
        
        # Wipe window borders and right panel/menu at x >= 650 (Trisa max_x is <= 635)
        out = frame.copy()
        out[:43, :] = 0
        out[788:, :] = 0
        out[:, :22] = 0
        out[:, 650:] = 0
        
        crop = out[50:800, 40:650]
        m = np.max(crop, axis=2)
        char_mask = (m > 8).astype(np.uint8) * 255
        
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
        clean_char = np.zeros_like(char_mask)
        for lbl in range(1, num_labels):
            if stats[lbl, cv2.CC_STAT_AREA] >= 20:
                clean_char[labels == lbl] = 255
                
        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        rgb[clean_char == 0] = 0
        
        rgba = np.dstack([rgb, clean_char])
        frames.append(rgba)

    cap.release()

    union_mask = np.zeros(frames[0].shape[:2], dtype=bool)
    for f in frames:
        union_mask |= (f[:, :, 3] > 20)

    ys, xs = np.where(union_mask)
    y_min, y_max = max(0, ys.min() - 8), min(frames[0].shape[0], ys.max() + 8)
    x_min, x_max = max(0, xs.min() - 8), min(frames[0].shape[1], xs.max() + 8)

    pil_frames = []
    for f in frames:
        cropped = f[y_min:y_max, x_min:x_max]
        dark = np.max(cropped[:, :, :3], axis=2) <= 8
        cropped[dark, 3] = 0
        pil_im = Image.fromarray(cropped, 'RGBA')
        pil_im = ImageOps.mirror(pil_im)
        pil_frames.append(pil_im)

    out_dir = os.path.join(ASSETS_DIR, 'trisa')
    os.makedirs(out_dir, exist_ok=True)
    out_webp = os.path.join(out_dir, 'hover_3d_idle.webp')
    pil_frames[0].save(
        out_webp,
        save_all=True,
        append_images=pil_frames[1:],
        duration=45,
        loop=0,
        lossless=True,
        quality=100,
        method=3
    )
    print(f'  Saved pristine {out_webp} ({len(pil_frames)} frames)', flush=True)

    full_img = pil_frames[0]
    out_full = os.path.join(out_dir, 'model_3d_full.png')
    full_img.save(out_full)

    w, h = full_img.size
    bust_img = full_img.crop((0, 0, w, int(h * 0.52)))
    out_bust = os.path.join(out_dir, 'model_3d_bust.png')
    bust_img.save(out_bust)
    print(f'  Saved clean model_3d_full.png and model_3d_bust.png', flush=True)

def rebuild_chibi_actions(hero, vpath, crop_box, actions, target_size=(430, 380)):
    print(f'=== Rebuilding {hero} Chibi Actions (Zero Dropdown, Pure Alpha) ===', flush=True)
    out_dir = os.path.join(ASSETS_DIR, hero)
    os.makedirs(out_dir, exist_ok=True)
    x1, y1, x2, y2 = crop_box
    target_w, target_h = target_size

    cap = cv2.VideoCapture(vpath)
    for act_name, act in actions.items():
        start, end, step, dur = act['start'], act['end'], act['step'], act['duration']
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        frames = []
        f_no = start
        while f_no <= end:
            ret, frame = cap.read()
            if not ret: break
            if (f_no - start) % step == 0:
                cleaned = clean_frame_chibi(frame, hero)
                # Crop character area
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
                resized = cv2.resize(rgba, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
                
                resized[0, :, 3] = 0
                resized[-1, :, 3] = 0
                resized[:, 0, 3] = 0
                resized[:, -1, 3] = 0
                
                dark_mask = np.max(resized[:, :, :3], axis=2) <= 8
                resized[dark_mask, 3] = 0
                
                pil_im = Image.fromarray(resized, 'RGBA')
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
            print(f'  Saved {hero}/{act_name}.webp ({len(frames)} frames) and .png', flush=True)
            
    cap.release()

def sync_all():
    print('=== Syncing Assets to server/static and dist ===', flush=True)
    for hero in ['trisa', 'heide']:
        src = os.path.join(ASSETS_DIR, hero)
        for dest in [
            os.path.join(BASE_DIR, 'server', 'static', 'assets', 'characters', hero),
            os.path.join(BASE_DIR, 'dist', 'assets', 'characters', hero)
        ]:
            os.makedirs(dest, exist_ok=True)
            for f in os.listdir(src):
                shutil.copy2(os.path.join(src, f), os.path.join(dest, f))
            print(f'Synced {hero} assets to {dest}', flush=True)

    # Sync video and audio
    for cat, fname in [
        ('video', 'trisa_ult.mp4'),
        (os.path.join('audio', 'voice'), 'ult_hero_trisa.mp3')
    ]:
        src_file = os.path.join(BASE_DIR, 'assets', cat, fname)
        if os.path.exists(src_file):
            for d in [
                os.path.join(BASE_DIR, 'server', 'static', 'assets', cat),
                os.path.join(BASE_DIR, 'dist', 'assets', cat)
            ]:
                os.makedirs(d, exist_ok=True)
                shutil.copy2(src_file, os.path.join(d, fname))
                print(f'Synced {fname} to {d}', flush=True)

if __name__ == '__main__':
    t0 = time.time()
    
    # 1. Rebuild Trisa hover & bust
    rebuild_trisa_hover()
    
    # 2. Rebuild Trisa chibi actions
    trisa_actions = {
        'chibi_idle': {'start': 60, 'end': 160, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 240, 'end': 320, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 445, 'end': 525, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 560, 'end': 640, 'step': 1, 'duration': 40},
        'chibi_attack3': {'start': 1000, 'end': 1080, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 3525, 'end': 3615, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 3930, 'end': 4010, 'step': 1, 'duration': 45}
    }
    rebuild_chibi_actions(
        hero='trisa',
        vpath=os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa2.mp4'),
        crop_box=(20, 40, 670, 788), # crop strictly up to x=670 so zero dropdown
        actions=trisa_actions
    )
    
    # 3. Rebuild Heide chibi actions
    heide_actions = {
        'chibi_idle': {'start': 285, 'end': 352, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 730, 'end': 805, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 505, 'end': 580, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 845, 'end': 902, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 2260, 'end': 2345, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 395, 'end': 470, 'step': 1, 'duration': 45}
    }
    rebuild_chibi_actions(
        hero='heide',
        vpath=os.path.join(BASE_DIR, 'scratch', 'raw_hero2_heide', 'heide_chibi.mp4'),
        crop_box=(20, 40, 670, 788),
        actions=heide_actions
    )
    
    # 4. Sync all assets
    sync_all()
    
    print(f'All finished flawlessly in {time.time()-t0:.1f}s!')

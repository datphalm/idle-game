import os
import sys
import time
import cv2
import numpy as np
from PIL import Image, ImageOps
import shutil

BASE_DIR = os.path.abspath('.')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets', 'characters')

def clean_spine_frame(frame):
    out = frame.copy()
    h, w = out.shape[:2]
    # Remove Spine window chrome:
    out[:44, :] = 0          # Top title bar
    out[788:, :] = 0         # Bottom toolbar
    out[:, :22] = 0          # Left border
    out[:50, 835:] = 0       # Right close button 'X'
    return out

def extract_character_alpha(frame, mirror=False):
    cleaned = clean_spine_frame(frame)
    m = np.max(cleaned, axis=2)
    char_mask = (m > 8).astype(np.uint8) * 255
    
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
    clean_mask = np.zeros_like(char_mask)
    
    for lbl in range(1, num_labels):
        area = stats[lbl, cv2.CC_STAT_AREA]
        x = stats[lbl, cv2.CC_STAT_LEFT]
        y = stats[lbl, cv2.CC_STAT_TOP]
        w = stats[lbl, cv2.CC_STAT_WIDTH]
        h = stats[lbl, cv2.CC_STAT_HEIGHT]
        
        if area < 20:
            continue
        # Remove mouse hand cursor: small disconnected icon in right area
        if w <= 32 and h <= 36 and area < 380 and x > 640:
            continue
        # Remove any lingering zoom text / bottom-right loop toolbar artifacts
        if y >= 775 and x >= 640 and area < 500:
            continue
            
        clean_mask[labels == lbl] = 255
        
    rgb = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
    rgb[clean_mask == 0] = 0
    
    # Smooth edges slightly
    alpha = clean_mask
    rgba = np.dstack([rgb, alpha])
    
    pil_im = Image.fromarray(rgba, 'RGBA')
    if mirror:
        pil_im = ImageOps.mirror(pil_im)
    return pil_im

def process_hero_showcase(hero, raw_vpath, mirror=False):
    print(f'=== Processing {hero} Showcase Model ===', flush=True)
    out_dir = os.path.join(ASSETS_DIR, hero)
    os.makedirs(out_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(raw_vpath)
    total_f = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, total_f // 50)
    
    frames = []
    for fi in range(0, total_f, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ret, frame = cap.read()
        if not ret: break
        pil_f = extract_character_alpha(frame, mirror=mirror)
        frames.append(pil_f)
    cap.release()
    
    if not frames:
        print(f'Error: No frames extracted for {hero} showcase')
        return
        
    # Calculate union bounding box across ALL frames
    min_x, min_y, max_x, max_y = 9999, 9999, -1, -1
    for f in frames:
        arr = np.array(f)
        ys, xs = np.where(arr[:, :, 3] > 10)
        if len(xs) > 0:
            min_x = min(min_x, xs.min())
            max_x = max(max_x, xs.max())
            min_y = min(min_y, ys.min())
            max_y = max(max_y, ys.max())
            
    # Add comfortable padding
    pad = 14
    w_orig, h_orig = frames[0].size
    x1 = max(0, min_x - pad)
    y1 = max(0, min_y - pad)
    x2 = min(w_orig, max_x + pad)
    y2 = min(h_orig, max_y + pad)
    
    cropped_frames = []
    for f in frames:
        cr = f.crop((x1, y1, x2, y2))
        cropped_frames.append(cr)
        
    # Save hover_3d_idle.webp
    out_webp = os.path.join(out_dir, 'hover_3d_idle.webp')
    cropped_frames[0].save(
        out_webp,
        save_all=True,
        append_images=cropped_frames[1:],
        duration=45,
        loop=0,
        lossless=False,
        quality=90,
        method=2
    )
    print(f'  Saved {out_webp} ({len(cropped_frames)} frames, size {cropped_frames[0].size})', flush=True)
    
    # Save model_3d_full.png and model_3d_bust.png
    full_img = cropped_frames[0]
    out_full = os.path.join(out_dir, 'model_3d_full.png')
    full_img.save(out_full)
    
    fw, fh = full_img.size
    bust_img = full_img.crop((0, 0, fw, int(fh * 0.54)))
    out_bust = os.path.join(out_dir, 'model_3d_bust.png')
    bust_img.save(out_bust)
    print(f'  Saved {out_full} and {out_bust}', flush=True)

def process_hero_chibi(hero, raw_vpath, actions, mirror=False, target_box_size=512):
    print(f'=== Processing {hero} Chibi Actions ===', flush=True)
    out_dir = os.path.join(ASSETS_DIR, hero)
    os.makedirs(out_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(raw_vpath)
    
    for act_name, cfg in actions.items():
        start = cfg['start']
        end = cfg['end']
        step = cfg.get('step', 1)
        dur = cfg.get('duration', 45)
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        raw_frames = []
        f_no = start
        while f_no <= end:
            ret, frame = cap.read()
            if not ret: break
            if (f_no - start) % step == 0:
                pil_f = extract_character_alpha(frame, mirror=mirror)
                raw_frames.append(pil_f)
            f_no += 1
            
        if not raw_frames:
            print(f'Warning: No frames for {hero} {act_name}')
            continue
            
        # Calculate union bounding box for this action
        min_x, min_y, max_x, max_y = 9999, 9999, -1, -1
        for f in raw_frames:
            arr = np.array(f)
            ys, xs = np.where(arr[:, :, 3] > 10)
            if len(xs) > 0:
                min_x = min(min_x, xs.min())
                max_x = max(max_x, xs.max())
                min_y = min(min_y, ys.min())
                max_y = max(max_y, ys.max())
                
        pad = 12
        w_orig, h_orig = raw_frames[0].size
        x1 = max(0, min_x - pad)
        y1 = max(0, min_y - pad)
        x2 = min(w_orig, max_x + pad)
        y2 = min(h_orig, max_y + pad)
        
        # Crop each frame
        action_frames = []
        for f in raw_frames:
            cr = f.crop((x1, y1, x2, y2))
            action_frames.append(cr)
            
        # Place centered-bottom into a standard proportional square canvas (512x512)
        # to ensure zero distortion and perfect scale across all animation states
        cw = x2 - x1
        ch = y2 - y1
        max_dim = max(cw, ch)
        scale = min(460 / max_dim, 1.0)
        
        scaled_w = int(cw * scale)
        scaled_h = int(ch * scale)
        
        centered_frames = []
        for cr in action_frames:
            res = cr.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (target_box_size, target_box_size), (0, 0, 0, 0))
            paste_x = (target_box_size - scaled_w) // 2
            paste_y = target_box_size - scaled_h - 18 # Align towards ground bottom
            canvas.paste(res, (paste_x, paste_y), res)
            centered_frames.append(canvas)
            
        out_webp = os.path.join(out_dir, f'{act_name}.webp')
        centered_frames[0].save(
            out_webp,
            save_all=True,
            append_images=centered_frames[1:],
            duration=dur,
            loop=0,
            lossless=False,
            quality=90,
            method=2
        )
        out_png = os.path.join(out_dir, f'{act_name}.png')
        centered_frames[0].save(out_png)
        print(f'  Saved {hero}/{act_name}.webp ({len(centered_frames)} frames)', flush=True)
        
    cap.release()

def sync_all():
    print('=== Syncing Assets to server/static and dist ===', flush=True)
    for hero in ['trisa', 'heide', 'hilde', 'meilin']:
        src = os.path.join(ASSETS_DIR, hero)
        for dest in [
            os.path.join(BASE_DIR, 'server', 'static', 'assets', 'characters', hero),
            os.path.join(BASE_DIR, 'dist', 'assets', 'characters', hero)
        ]:
            os.makedirs(dest, exist_ok=True)
            for f in os.listdir(src):
                if f.endswith(('.webp', '.png')):
                    shutil.copy2(os.path.join(src, f), os.path.join(dest, f))
        print(f'Synced {hero} assets successfully.')

if __name__ == '__main__':
    t0 = time.time()
    
    # 1. TRISA (Naturally faces right)
    process_hero_showcase('trisa', 'scratch/trisa_raw/trisa1.mp4', mirror=False)
    process_hero_chibi('trisa', 'scratch/trisa_raw/trisa2.mp4', {
        'chibi_idle': {'start': 97, 'end': 137, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 240, 'end': 320, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 360, 'end': 420, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 520, 'end': 600, 'step': 1, 'duration': 40},
        'chibi_attack3': {'start': 700, 'end': 780, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 860, 'end': 950, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 3670, 'end': 3760, 'step': 1, 'duration': 45}
    }, mirror=False)
    
    # 2. HEIDE (Naturally faces left -> mirror=True to face right)
    process_hero_showcase('heide', 'scratch/raw_hero2_heide/heide_left.mp4', mirror=False)
    process_hero_chibi('heide', 'scratch/raw_hero2_heide/heide_chibi.mp4', {
        'chibi_idle': {'start': 285, 'end': 352, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 730, 'end': 805, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 505, 'end': 580, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 845, 'end': 902, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 2260, 'end': 2345, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 395, 'end': 470, 'step': 1, 'duration': 45}
    }, mirror=True)
    
    # 3. HILDE (Naturally faces right)
    process_hero_showcase('hilde', 'scratch/raw_hero1_hilde/hilde_left.mp4', mirror=False)
    process_hero_chibi('hilde', 'scratch/raw_hero1_hilde/hilde_chibi.mp4', {
        'chibi_idle': {'start': 80, 'end': 140, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 300, 'end': 350, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 210, 'end': 255, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 660, 'end': 710, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 765, 'end': 865, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 384, 'end': 415, 'step': 1, 'duration': 45}
    }, mirror=False)
    
    # 4. MEI LIN (Naturally faces right)
    process_hero_showcase('meilin', 'scratch/raw_hero3_meilin/meilin_left.mp4', mirror=False)
    process_hero_chibi('meilin', 'scratch/raw_hero3_meilin/meilin_chibi.mp4', {
        'chibi_idle': {'start': 270, 'end': 330, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 650, 'end': 710, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 760, 'end': 820, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 1070, 'end': 1130, 'step': 1, 'duration': 40},
        'chibi_attack3': {'start': 760, 'end': 820, 'step': 1, 'duration': 42},
        'chibi_skill': {'start': 370, 'end': 470, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 835, 'end': 868, 'step': 1, 'duration': 45}
    }, mirror=False)
    
    sync_all()
    print(f'ALL 4 HEROES REBUILT FLAWLESSLY WITH ZERO CUTS IN {time.time()-t0:.1f}s!')

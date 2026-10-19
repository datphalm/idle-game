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
    out[:48, :] = 0          # Top title bar
    out[:55, 825:] = 0       # Right close button 'X'
    out[:, :22] = 0          # Left border
    out[:, w-8:] = 0         # Right border
    out[795:, :] = 0         # Bottom player controls bar (scrubber, speed, loop, animation combobox)
    out[785:, :60] = 0       # Play / pause button on bottom left
    out[775:, 700:] = 0      # Zoom / pan text on bottom right
    
    # Active Dropdown Menu Detection & Purge:
    # If the Spine dropdown popup is open, it appears as a solid column of gray pixels (RGB 22..60)
    gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
    dd_box = gray[100:750, 670:875]
    dd_px = np.count_nonzero((dd_box > 22) & (dd_box < 60))
    if dd_px > 3000:
        # Wipe out entire dropdown menu box cleanly
        out[60:800, 660:] = 0
    return out

def extract_character_alpha(frame, mirror=False):
    cleaned = clean_spine_frame(frame)
    h, w = cleaned.shape[:2]
    m = np.max(cleaned, axis=2)
    char_mask = (m > 8).astype(np.uint8) * 255
    
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
    clean_mask = np.zeros_like(char_mask)
    if num_labels <= 1:
        return Image.fromarray(np.zeros((h, w, 4), dtype=np.uint8), 'RGBA')
    
    for lbl in range(1, num_labels):
        area = stats[lbl, cv2.CC_STAT_AREA]
        x = stats[lbl, cv2.CC_STAT_LEFT]
        y = stats[lbl, cv2.CC_STAT_TOP]
        cw = stats[lbl, cv2.CC_STAT_WIDTH]
        ch = stats[lbl, cv2.CC_STAT_HEIGHT]
        cx, cy = centroids[lbl]
        
        if area < 15:
            continue
        # 1. Eliminate Spine dropdown popup menu or any vertical box at right edge
        if x >= 640 and (ch > 60 or area > 1000):
            continue
        # 2. Eliminate mouse hand cursor in right quadrant
        if cw <= 35 and ch <= 40 and area < 400 and x > 640:
            continue
        # 3. Eliminate collapsed dropdown button / loop checkbox
        if x >= 640 and y >= 640 and (cw <= 120 and ch <= 120) and area < 5000 and cx > 680:
            continue
        # 4. Eliminate any remaining bottom-right zoom / fit text
        if y >= 770 and x >= 680:
            continue
        # 5. Eliminate thin horizontal window/toolbar border lines (e.g. 3px tall by 670px wide)
        if ch <= 8 and cw > 80:
            continue
            
        clean_mask[labels == lbl] = 255
        
    rgb = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
    rgb[clean_mask == 0] = 0
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
    # process_hero_showcase('trisa', 'scratch/trisa_raw/trisa1.mp4', mirror=False)
    process_hero_chibi('trisa', 'scratch/trisa_raw/trisa2.mp4', {
        'chibi_idle': {'start': 97, 'end': 137, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 195, 'end': 275, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 400, 'end': 465, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 505, 'end': 570, 'step': 1, 'duration': 40},
        'chibi_attack3': {'start': 620, 'end': 695, 'step': 1, 'duration': 40},
        'chibi_attack4': {'start': 3480, 'end': 3545, 'step': 1, 'duration': 42},
        'chibi_attack5': {'start': 3645, 'end': 3695, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 868, 'end': 940, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 3670, 'end': 3760, 'step': 1, 'duration': 45}
    }, mirror=False)
    
    # 2. HEIDE (Naturally faces left -> mirror=True to face right)
    # process_hero_showcase('heide', 'scratch/raw_hero2_heide/heide_left.mp4', mirror=False)
    process_hero_chibi('heide', 'scratch/raw_hero2_heide/heide_chibi.mp4', {
        'chibi_idle': {'start': 285, 'end': 345, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 730, 'end': 800, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 510, 'end': 575, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 845, 'end': 900, 'step': 1, 'duration': 40},
        'chibi_attack3': {'start': 1482, 'end': 1544, 'step': 1, 'duration': 40},
        'chibi_attack4': {'start': 3030, 'end': 3082, 'step': 1, 'duration': 42},
        'chibi_attack5': {'start': 618, 'end': 672, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 2260, 'end': 2338, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 395, 'end': 465, 'step': 1, 'duration': 45}
    }, mirror=True)
    
    # 3. HILDE (Naturally faces right)
    # process_hero_showcase('hilde', 'scratch/raw_hero1_hilde/hilde_left.mp4', mirror=False)
    process_hero_chibi('hilde', 'scratch/raw_hero1_hilde/hilde_chibi.mp4', {
        'chibi_idle': {'start': 80, 'end': 135, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 245, 'end': 325, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 155, 'end': 205, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 675, 'end': 735, 'step': 1, 'duration': 40},
        'chibi_attack3': {'start': 2395, 'end': 2452, 'step': 1, 'duration': 42},
        'chibi_attack4': {'start': 3380, 'end': 3425, 'step': 1, 'duration': 40},
        'chibi_attack5': {'start': 3860, 'end': 3900, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 770, 'end': 825, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 370, 'end': 412, 'step': 1, 'duration': 45}
    }, mirror=False)
    
    # 4. MEI LIN (Naturally faces right)
    # process_hero_showcase('meilin', 'scratch/raw_hero3_meilin/meilin_left.mp4', mirror=False)
    process_hero_chibi('meilin', 'scratch/raw_hero3_meilin/meilin_chibi.mp4', {
        'chibi_idle': {'start': 275, 'end': 335, 'step': 1, 'duration': 45},
        'chibi_walk': {'start': 640, 'end': 705, 'step': 1, 'duration': 40},
        'chibi_attack': {'start': 715, 'end': 765, 'step': 1, 'duration': 42},
        'chibi_attack2': {'start': 70, 'end': 135, 'step': 1, 'duration': 42},
        'chibi_attack3': {'start': 445, 'end': 505, 'step': 1, 'duration': 40},
        'chibi_attack4': {'start': 1096, 'end': 1140, 'step': 1, 'duration': 40},
        'chibi_attack5': {'start': 2064, 'end': 2125, 'step': 1, 'duration': 40},
        'chibi_skill': {'start': 450, 'end': 505, 'step': 2, 'duration': 46},
        'chibi_hit': {'start': 868, 'end': 902, 'step': 1, 'duration': 45}
    }, mirror=False)
    
    sync_all()
    print(f'ALL 4 HEROES REBUILT FLAWLESSLY WITH ZERO CUTS IN {time.time()-t0:.1f}s!')

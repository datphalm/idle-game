import os
import sys
import time
import cv2
import numpy as np
from PIL import Image, ImageOps
import imageio_ffmpeg
import subprocess
import shutil

BASE_DIR = os.path.abspath('.')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets', 'characters')
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

def clean_frame(raw, hero='', is_attack=False):
    out = raw.copy()
    out[:43, :] = 0
    out[788:, :] = 0
    out[:, :22] = 0
    out[:, 870:] = 0
    
    # Target dropdown menu pixels in lower-right quadrant
    dd_roi = out[380:785, 665:870]
    gray_mask = (dd_roi[:,:,0] >= 20) & (dd_roi[:,:,0] <= 60) & \
                (dd_roi[:,:,1] >= 20) & (dd_roi[:,:,1] <= 60) & \
                (dd_roi[:,:,2] >= 20) & (dd_roi[:,:,2] <= 60)
    blue_mask = (dd_roi[:,:,0] > 140) & (dd_roi[:,:,2] < 110) & (dd_roi[:,:,1] > 40) & (dd_roi[:,:,1] < 215)
    dd_roi[gray_mask | blue_mask] = 0
    
    # Trisa-specific dropdown menu in Spine recording window (x=506..750, y=240..600)
    if hero == 'trisa':
        if not is_attack:
            # Completely zero out the entire dropdown area (Trisa's body is strictly x < 505)
            out[240:600, 506:750] = 0
        else:
            # Zero out scrollbar
            out[300:500, 725:750] = 0
            # Zero out menu background and neutral white text while preserving rich red/magenta slash VFX
            m_roi = out[240:600, 506:750]
            c_max = np.max(m_roi, axis=2).astype(int)
            c_min = np.min(m_roi, axis=2).astype(int)
            color_diff = c_max - c_min
            gray_bg = (m_roi[:,:,0] >= 30) & (m_roi[:,:,0] <= 90) & \
                      (m_roi[:,:,1] >= 10) & (m_roi[:,:,1] <= 60) & \
                      (m_roi[:,:,2] >= 15) & (m_roi[:,:,2] <= 70)
            neutral_text = (c_min >= 70) & (color_diff < 40)
            m_roi[gray_bg | neutral_text] = 0
        
    return out

def rebuild_trisa_hover():
    print('=== Rebuilding Trisa hover_3d_idle, model_3d_full, model_3d_bust ===', flush=True)
    vpath = os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa1.mp4')
    cap = cv2.VideoCapture(vpath)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames = []

    for fi in range(n):
        ret, frame = cap.read()
        if not ret: break
        
        cleaned = clean_frame(frame, 'trisa', is_attack=False)
        crop = cleaned[50:800, 40:840]
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
    print(f'Saved clean {out_webp} ({len(pil_frames)} frames)', flush=True)

    # Save model_3d_full.png and model_3d_bust.png
    full_img = pil_frames[0]
    out_full = os.path.join(out_dir, 'model_3d_full.png')
    full_img.save(out_full)
    w, h = full_img.size
    bust = full_img.crop((0, 0, w, int(h * 0.55)))
    out_bust = os.path.join(out_dir, 'model_3d_bust.png')
    bust.save(out_bust)
    print(f'Saved clean {out_full} and {out_bust}', flush=True)

def rebuild_trisa_chibi():
    print('=== Rebuilding Trisa Chibi Actions (Zero Dropdown) ===', flush=True)
    cfg = {
        'video_path': os.path.join(BASE_DIR, 'scratch', 'trisa_raw', 'trisa2.mp4'),
        'crop_box': (20, 40, 870, 788),
        'target_w': 430,
        'target_h': 380,
        'actions': {
            'chibi_idle': {'start': 97, 'end': 137, 'step': 1, 'duration': 45, 'attack': False},
            'chibi_walk': {'start': 418, 'end': 466, 'step': 1, 'duration': 40, 'attack': False},
            'chibi_attack': {'start': 828, 'end': 864, 'step': 1, 'duration': 42, 'attack': True},
            'chibi_attack2': {'start': 1500, 'end': 1555, 'step': 1, 'duration': 40, 'attack': True},
            'chibi_attack3': {'start': 1775, 'end': 1835, 'step': 1, 'duration': 42, 'attack': True},
            'chibi_skill': {'start': 1073, 'end': 1165, 'step': 2, 'duration': 48, 'attack': False},
            'chibi_hit': {'start': 978, 'end': 1030, 'step': 2, 'duration': 45, 'attack': False}
        }
    }
    h_dir = os.path.join(ASSETS_DIR, 'trisa')
    vpath = cfg['video_path']
    x1, y1, x2, y2 = cfg['crop_box']
    target_w, target_h = cfg['target_w'], cfg['target_h']

    cap = cv2.VideoCapture(vpath)
    for act_name, act in cfg['actions'].items():
        start, end, step, dur, is_atk = act['start'], act['end'], act['step'], act['duration'], act['attack']
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        frames = []
        f_no = start
        while f_no <= end:
            ret, frame = cap.read()
            if not ret: break
            if (f_no - start) % step == 0:
                cleaned = clean_frame(frame, 'trisa', is_attack=is_atk)
                sub = cleaned[y1:y2, x1:x2]
                
                m = np.max(sub, axis=2)
                char_mask = (m > 8).astype(np.uint8) * 255
                
                num_l, labels, stats, _ = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
                clean_mask = np.zeros_like(char_mask)
                for lbl in range(1, num_l):
                    if stats[lbl, cv2.CC_STAT_AREA] >= 15:
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
            out_png = os.path.join(h_dir, f'{act_name}.png')
            frames[0].save(out_png)
            print(f'  Saved trisa/{act_name}.webp ({len(frames)} frames) and .png', flush=True)
    cap.release()

def rebuild_trisa_ult():
    print('=== Rebuilding Trisa Ultimate Fullscreen (No Bottom Black Bar) ===', flush=True)
    cap = cv2.VideoCapture('scratch/trisa_raw/trisa_ultimate.mp4')
    trisa_frames = []
    for i in range(38): # Cycle 1 frames 0..37
        ret, frame = cap.read()
        if not ret: break
        # Crop [6:408, 0:878] -> clean widescreen anime without black bars
        cropped = frame[6:408, 0:878]
        trisa_frames.append(cropped)
    cap.release()

    last_f = trisa_frames[-1]
    h, w = last_f.shape[:2]
    extended_trisa = list(trisa_frames)
    for i in range(14): # Hold climax impact for 0.47s
        extended_trisa.append(last_f)

    temp_v = 'scratch/temp_trisa_ult_clean.mp4'
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out_v = cv2.VideoWriter(temp_v, fourcc, 30.0, (w, h))
    for f in extended_trisa:
        out_v.write(f)
    out_v.release()

    out_video = 'assets/video/trisa_ult.mp4'
    cmd = [
        ffmpeg, '-y',
        '-i', temp_v,
        '-ss', '0.0', '-t', '1.75',
        '-i', 'scratch/trisa_raw/trisa_sound.mp4',
        '-filter_complex', '[0:v]scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.0[v];[1:a]afade=t=out:st=1.5:d=0.25[a]',
        '-map', '[v]',
        '-map', '[a]',
        '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '320k',
        '-shortest',
        out_video
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f'Generated clean fullscreen {out_video}', flush=True)

    # Standalone audio
    subprocess.run([
        ffmpeg, '-y',
        '-ss', '0.0', '-t', '1.75',
        '-i', 'scratch/trisa_raw/trisa_sound.mp4',
        '-af', 'afade=t=out:st=1.5:d=0.25',
        '-vn', '-c:a', 'libmp3lame', '-b:a', '320k',
        'assets/audio/voice/ult_hero_trisa.mp3'
    ], capture_output=True)

def sync_all():
    print('=== Syncing to server/static and dist ===', flush=True)
    for d in ['server/static/assets/characters/trisa', 'dist/assets/characters/trisa']:
        os.makedirs(d, exist_ok=True)
        for f in os.listdir('assets/characters/trisa'):
            if f.endswith(('.webp', '.png')):
                shutil.copy2(os.path.join('assets/characters/trisa', f), os.path.join(d, f))
        print(f'Synced trisa assets to {d}')
        
    for d in ['server/static/assets/video', 'dist/assets/video']:
        os.makedirs(d, exist_ok=True)
        shutil.copy2('assets/video/trisa_ult.mp4', os.path.join(d, 'trisa_ult.mp4'))
        print(f'Synced video to {d}')
        
    for d in ['server/static/assets/audio/voice', 'dist/assets/audio/voice']:
        os.makedirs(d, exist_ok=True)
        shutil.copy2('assets/audio/voice/ult_hero_trisa.mp3', os.path.join(d, 'ult_hero_trisa.mp3'))
        print(f'Synced audio to {d}')

if __name__ == '__main__':
    t0 = time.time()
    rebuild_trisa_ult()
    rebuild_trisa_hover()
    rebuild_trisa_chibi()
    sync_all()
    print(f'DONE! All Trisa assets cleaned with ZERO dropdown and 100% fullscreen ult in {time.time()-t0:.1f}s!')

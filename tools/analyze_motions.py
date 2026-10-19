import cv2, numpy as np, os

def analyze_character_actions(vpath, hero_name):
    cap = cv2.VideoCapture(vpath)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f'=== {hero_name.upper()} ({total} frames) ===', flush=True)
    
    step = 2
    f_no = 0
    prev_gray = None
    motion_list = []
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        if f_no % step == 0:
            small = cv2.resize(frame, (160, 160))
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            # Mask out spine controls (bottom 25px, top 10px, right 30px)
            gray[:10, :] = 0
            gray[140:, :] = 0
            gray[:, :10] = 0
            gray[:, 130:] = 0
            if prev_gray is not None:
                d = float(np.mean(cv2.absdiff(gray, prev_gray)))
                motion_list.append((f_no, d))
            prev_gray = gray
        f_no += 1
    cap.release()
    
    clusters = []
    in_act = False
    s_f, e_f = 0, 0
    max_d = 0
    peak_f = 0
    
    for f, d in motion_list:
        if d > 7.5:
            if not in_act:
                in_act = True
                s_f = f
                max_d = d
                peak_f = f
            e_f = f
            if d > max_d:
                max_d = d
                peak_f = f
        else:
            if in_act:
                if f - e_f > 20: # gap > 20 frames
                    if e_f - s_f >= 18:
                        clusters.append({'start': s_f, 'end': e_f, 'peak_m': max_d, 'peak_f': peak_f})
                    in_act = False
    if in_act and e_f - s_f >= 18:
        clusters.append({'start': s_f, 'end': e_f, 'peak_m': max_d, 'peak_f': peak_f})
        
    print(f'Found {len(clusters)} motion clusters.', flush=True)
    
    cap = cv2.VideoCapture(vpath)
    thumbs = []
    for idx, c in enumerate(clusters):
        f_mid = c['peak_f']
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_mid)
        ret, frame = cap.read()
        if ret:
            ch = frame[120:760, 180:720]
            ch = cv2.resize(ch, (160, 160))
            s_val = c['start']
            e_val = c['end']
            pm_val = c['peak_m']
            cv2.putText(ch, f'#{idx}: {s_val}-{e_val}', (5, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 255, 0), 1)
            cv2.putText(ch, f'peak {pm_val:.1f}', (5, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 255, 0), 1)
            thumbs.append(ch)
            print(f'  Cluster #{idx:2d}: frames {s_val:4d}..{e_val:4d} (len {e_val-s_val:3d}) | peak motion {pm_val:4.1f} at f{f_mid}', flush=True)
    cap.release()
    
    if thumbs:
        cols = 5
        rows = (len(thumbs) + cols - 1) // cols
        grid = np.zeros((rows * 160, cols * 160, 3), dtype=np.uint8)
        for i, th in enumerate(thumbs):
            r = i // cols
            col = i % cols
            grid[r*160:(r+1)*160, col*160:(col+1)*160] = th
        out_name = f'scratch/clusters_{hero_name}.jpg'
        cv2.imwrite(out_name, grid)
        print(f'Saved {out_name} ({rows}x{cols})\n', flush=True)

if __name__ == '__main__':
    analyze_character_actions('scratch/raw_hero3_meilin/meilin_chibi.mp4', 'meilin')
    analyze_character_actions('scratch/raw_hero1_hilde/hilde_chibi.mp4', 'hilde')
    analyze_character_actions('scratch/raw_hero2_heide/heide_chibi.mp4', 'heide')
    analyze_character_actions('scratch/trisa_raw/trisa2.mp4', 'trisa')

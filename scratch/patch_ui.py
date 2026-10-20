with open('js/ui/ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """          const btn = document.querySelector(`.btn-skill-upgrade[data-skill="${skKey}"]`);
          if (btn) btn.disabled = (GameState.player?.gold || 0) < newCost;

          this.updateStatusBar();"""

replacement = """          const btn = document.querySelector(`.btn-skill-upgrade[data-skill="${skKey}"]`);
          if (btn) btn.disabled = (GameState.player?.gold || 0) < newCost;

          const effElem = document.getElementById(`skill-current-effect-${skKey}`);
          if (effElem) {
            const sk = skKey === 's1' ? heroCfg?.skills?.[0] : (skKey === 's2' ? heroCfg?.skills?.[1] : heroCfg?.skills?.[2]);
            if (skKey === 's3') {
              const scaledMult = Math.round((sk?.dmgMult || 5.5) * (1 + (newLevel - 1) * 0.1) * 100);
              effElem.innerHTML = `⚡ Uy lực hiện tại: <strong style="color:#00ffcc;">${scaledMult}% ATK</strong> <span style="color:#94a3b8;">(+${(newLevel - 1) * 10}% Nộ)</span>`;
            } else if (skKey === 's2') {
              const scaledMult = Math.round((sk?.dmgMult || 2.0) * (1 + (newLevel - 1) * 0.08) * 100);
              effElem.innerHTML = `⚔️ Uy lực hiện tại: <strong style="color:#38bdf8;">${scaledMult}% ATK</strong> <span style="color:#94a3b8;">(+${(newLevel - 1) * 8}% Chiêu)</span>`;
            } else {
              const bonusAtkPct = Math.round(((sk?.bonusAtk || 0.10) * (1 + (newLevel - 1) * 0.08)) * 100);
              effElem.innerHTML = `🔥 Hiệu quả hiện tại: <strong style="color:#fbbf24;">+${bonusAtkPct}% ATK toàn diện</strong>`;
            }
          }

          this.updateStatusBar();"""

if target in content:
    content = content.replace(target, replacement, 1)
    with open('js/ui/ui.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    print('TARGET NOT FOUND')

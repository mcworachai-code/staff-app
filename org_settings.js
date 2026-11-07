/* =====================================================================
   org_settings.js — หน้า "ตั้งค่าร้าน" (Admin) + แบรนด์/สีสาขาแบบ dynamic  (เฟส 2.0)
   วางไฟล์นี้ไว้ข้าง index.html แล้วใส่ <script src="org_settings.js"></script>
   ก่อน </body> (หลัง <script> หลัก เพราะใช้ฟังก์ชัน/ตัวแปรร่วม: $, api, esc, ico, toast, D, go, confirmDlg)
   ===================================================================== */

/* ---------- แบรนด์ + สีสาขา ----------
   เรียก applyBranding(D) ทุกครั้งที่ได้ข้อมูลจาก getAppData (ดู loadData ใน index.html) */
function _mix(hex, w) {            // ผสมสีกับขาว w = 0..1
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = c => Math.round(c + (255 - c) * w).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
function applyBranding(d) {
  if (!d) return;
  let css = '';
  const org = d.org || {};
  if (org.color && /^#[0-9a-fA-F]{6}$/.test(org.color) && org.color.toLowerCase() !== '#27500a') {
    css += `:root{--brand:${org.color};--brand-2:${_mix(org.color, .15)};--brand-3:${_mix(org.color, .35)};--brand-4:${_mix(org.color, .6)};--soft:${_mix(org.color, .9)};--bg:${_mix(org.color, .95)};--line:${_mix(org.color, .82)};}`;
  }
  (d.branches || []).forEach(b => {
    const c = String(b.code).replace(/[^A-Za-z0-9_-]/g, ''), col = /^#[0-9a-fA-F]{6}$/.test(b.color) ? b.color : '#3B6D11';
    css += `.br-${c},.chip.br-${c},.shift.br-${c},.ab-${c}{background:${col};color:#fff}.chip.slot.br-${c}{background:transparent;color:${col}}`;
  });
  let el = document.getElementById('brandStyle');
  if (!el) { el = document.createElement('style'); el.id = 'brandStyle'; document.head.appendChild(el); }
  el.textContent = css;
  if (org.name) document.title = org.name;
}

/* ---------- หน้า "ตั้งค่าร้าน" ---------- */
let OS = null;   // ข้อมูลที่โหลดมา

const _v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
const _c = id => { const e = document.getElementById(id); return !!(e && e.checked); };
const _in = (id, val, type, extra) => `<input id="${id}" type="${type || 'text'}" value="${esc(val == null ? '' : val)}" ${extra || ''}>`;
const _tm = (id, val) => _in(id, val, 'time');

function _sec(title, icon, body, saveFn, openIt) {
  return `<details class="card osec" ${openIt ? 'open' : ''} style="margin-bottom:12px">
    <summary style="cursor:pointer;font-weight:700;color:var(--brand);font-size:16px">${ico(icon)} ${esc(title)}</summary>
    <div style="margin-top:10px">${body}
    ${saveFn ? `<div class="row" style="margin-top:14px"><span class="sp"></span><button class="btn btn-p" onclick="${saveFn}">${ico('device-floppy')} บันทึก${esc(title)}</button></div>` : ''}</div>
  </details>`;
}

async function viewOrgSettings() {
  $('main').innerHTML = '<div class="loading">กำลังโหลด...</div>';
  try { OS = await api('getSettings'); } catch (e) { return toast(e.message); }
  const o = OS.org, bu = OS.branchUsage || {};
  let h = `<h2 class="t">${ico('building-store')} ตั้งค่าร้าน</h2>
    <p class="muted" style="font-size:13px">แก้แล้วกด "บันทึก" ของแต่ละหมวด · ค่าเวลาเปิด-ปิดของสาขาเป็นค่าเริ่มต้น พนักงานแต่ละคนตั้งค่าเฉพาะตัวได้ที่หมวด "กฎรายบุคคล"</p>`;

  /* 1) องค์กร */
  h += _sec('ข้อมูลองค์กร', 'building', `
    <label class="l">ชื่อองค์กร</label>${_in('os_name', o.name)}
    <div class="row" style="gap:12px;align-items:flex-end;flex-wrap:wrap">
      <div><label class="l">สีหลัก</label><input id="os_color" type="color" value="${esc(o.color)}" style="width:72px;height:44px;padding:3px"></div>
      <div class="sp" style="min-width:200px"><label class="l">ลิงก์โลโก้ (https://...) — เว้นว่างได้</label>${_in('os_logo', o.logo)}</div>
    </div>
    <p class="muted" style="font-size:12px;margin-top:8px">โควต้าสาขา: ใช้อยู่ ${bu.used ?? '-'} / ${bu.quota ?? '-'} สาขา · โมดูลที่เปิด: ${(o.modules || []).map(esc).join(', ') || '-'}</p>`, 'saveOrgInfo()', true);

  /* 2) สาขา */
  h += _sec('สาขา', 'map-pin', OS.branches.map(b => `
    <div class="card" style="background:var(--soft);margin-bottom:10px">
      <div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap">
        <b style="font-size:17px;min-width:36px">${esc(b.code)}</b>
        <div class="sp" style="min-width:160px"><label class="l">ชื่อสาขา</label>${_in('bn_' + b.code, b.name)}</div>
        <div><label class="l">สี</label><input id="bc_${b.code}" type="color" value="${esc(b.color)}" style="width:64px;height:44px;padding:3px"></div>
      </div>
      <div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0 12px">
        <div><label class="l">เปิดร้าน</label>${_tm('bo_' + b.code, b.open_time)}</div>
        <div><label class="l">ปิดร้าน (ใช้แทนสแกนออกสิ้นเดือน)</label>${_tm('bx_' + b.code, b.close_time)}</div>
        <div><label class="l">เปิดวันอาทิตย์ (ถ้าต่าง)</label>${_tm('bs_' + b.code, b.sun_open_time)}</div>
        <div><label class="l">เวร PT เริ่ม</label>${_tm('bp1_' + b.code, b.pt_shift_start)}</div>
        <div><label class="l">เวร PT จบ</label>${_tm('bp2_' + b.code, b.pt_shift_end)}</div>
        <div><label class="l">สแกนออกตั้งแต่ (ปัดขึ้น)</label>${_tm('br1_' + b.code, b.scan_round_from)}</div>
        <div><label class="l">ปัดเป็นเวลา</label>${_tm('br2_' + b.code, b.scan_round_to)}</div>
        <div><label class="l">ละติจูด</label>${_in('bla_' + b.code, b.lat, 'number', 'step="any"')}</div>
        <div><label class="l">ลองจิจูด</label>${_in('blo_' + b.code, b.lng, 'number', 'step="any"')}</div>
        <div><label class="l">รัศมีลงเวลา (ม.)</label>${_in('brd_' + b.code, b.checkin_radius_m, 'number')}</div>
      </div>
    </div>`).join(''), 'saveBranches()');

  /* 3) ประเภทลา */
  h += _sec('ประเภทลาและโควต้า', 'calendar-stats', `
    <div class="scroll"><table class="tb"><tr><th>ประเภท</th><th>โควต้า (วัน/ปี)</th><th>ลาครึ่งวัน</th><th>เปิดใช้</th></tr>
    ${OS.leaveTypes.map(l => {
      const q = ['sick', 'personal', 'holiday', 'vacation'].includes(l.key);
      return `<tr><td><b>${esc(l.label)}</b>${l.is_pc ? ' <span class="muted">(PC)</span>' : ''}</td>
        <td>${q ? _in('lq_' + l.key, l.quota_days, 'number', 'min="0" step="0.5" style="max-width:110px"') : '<span class="muted">-</span>'}</td>
        <td>${q ? `<input id="lh_${l.key}" type="checkbox" style="width:auto" ${l.half ? 'checked' : ''}>` : '<span class="muted">-</span>'}</td>
        <td><input id="la_${l.key}" type="checkbox" style="width:auto" ${l.active ? 'checked' : ''}></td></tr>`;
    }).join('')}</table></div>
    <p class="muted" style="font-size:12px">ชื่อประเภทลาแก้ไม่ได้ (ผูกกับประวัติการลาเดิม) · โควต้านักขัตฯ/พักร้อนคิดตามสัดส่วนวันเริ่มงานเหมือนเดิม</p>`, 'saveLeaveTypes()');

  /* 4) กลุ่มเวร */
  h += _sec('กลุ่มเวร', 'users-group', `
    <div id="grpList">${OS.groups.map((g, i) => _grpRow(i, g)).join('')}</div>
    <button class="btn btn-sm" onclick="addGrpRow()" style="margin-top:6px">${ico('plus')} เพิ่มกลุ่ม</button>
    <p class="muted" style="font-size:12px">ติ๊ก "เภสัช" = คนในกลุ่มนี้นับเป็นเภสัชประจำสาขา (ใช้เช็คว่าสาขามีเภสัช/PT ครบ)</p>`, 'saveGroups()');

  /* 5) กฎของร้าน */
  const pc = (OS.rules.find(r => r.rule_key === 'pc_move') || { enabled: false, params: {} }), bp = (OS.rules.find(r => r.rule_key === 'branch_pharm') || { enabled: false, params: {} });
  const people = `<option value="">— เลือกพนักงาน —</option>` + OS.people.map(p => `<option value="${esc(p.abbr)}">${esc(p.abbr)} · ${esc(p.nickname)}</option>`).join('');
  const brOpts = sel => OS.branches.map(b => `<option ${b.code === sel ? 'selected' : ''}>${esc(b.code)}</option>`).join('');
  h += _sec('กฎของร้าน', 'adjustments', `
    <div class="card" style="background:var(--soft)">
      <label style="display:flex;gap:8px;align-items:center;font-weight:700"><input id="rl_pc_on" type="checkbox" style="width:auto" ${pc.enabled ? 'checked' : ''}> ย้ายพนักงานเมื่อ PC ที่สาขาต้นทางครบจำนวน</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0 12px">
        <div><label class="l">พนักงานที่ถูกย้าย</label><select id="rl_pc_abbr">${people}</select></div>
        <div><label class="l">เมื่อ PC ครบ (คน)</label>${_in('rl_pc_min', pc.params.pc_min || 2, 'number', 'min="1" max="10"')}</div>
        <div><label class="l">จากสาขา</label><select id="rl_pc_from">${brOpts(pc.params.from_branch || 'YA')}</select></div>
        <div><label class="l">ไปสาขา</label><select id="rl_pc_to">${brOpts(pc.params.to_branch || 'HE')}</select></div>
      </div></div>
    <div class="card" style="background:var(--soft);margin-top:10px">
      <label style="display:flex;gap:8px;align-items:center;font-weight:700"><input id="rl_bp_on" type="checkbox" style="width:auto" ${bp.enabled ? 'checked' : ''}> เภสัชประจำสาขา (ถ้าไม่มีต้องมี PT)</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0 12px">
        <div><label class="l">เภสัชประจำ</label><select id="rl_bp_abbr">${people}</select></div>
        <div><label class="l">ประจำสาขา</label><select id="rl_bp_br">${brOpts(bp.params.branch || 'HE')}</select></div>
      </div></div>`, 'saveRules()');
  setTimeout(() => { // ตั้งค่า select หลัง render
    if ($('rl_pc_abbr')) $('rl_pc_abbr').value = pc.params.abbr || '';
    if ($('rl_bp_abbr')) $('rl_bp_abbr').value = bp.params.abbr || '';
  }, 0);

  /* 6) ค่าตั้งค่า */
  const grpName = { general: 'ทั่วไป', payroll: 'เงินเดือน / เวลาทำงาน' };
  ['general', 'payroll'].forEach(g => {
    h += _sec('ตั้งค่า' + grpName[g], g === 'general' ? 'settings' : 'cash',
      OS.settings.filter(s => s.group === g).map(s => `<label class="l">${esc(s.label)}</label>` +
        (s.type === 'number' ? _in('st_' + s.key, s.value, 'number', 'min="0" step="any"')
          : s.type === 'month' ? _in('st_' + s.key, s.value, 'month')
          : s.type === 'time' ? _tm('st_' + s.key, s.value)
          : _in('st_' + s.key, s.value))).join(''), `saveSettingGroup('${g}')`);
  });

  /* 7) กฎรายบุคคล */
  h += _sec('กฎรายบุคคล', 'user-cog', `
    <p class="muted" style="font-size:13px">เวลาเข้า-ออก, เวลาพัก, เรท OT, เบี้ยไม่สาย ฯลฯ ของแต่ละคน — ช่องที่ว่างจะใช้ค่าของสาขา/ร้าน</p>
    <div class="scroll"><table class="tb"><tr><th>ตัวย่อ</th><th>ชื่อ</th><th>กลุ่ม</th><th></th></tr>
    ${OS.people.map(p => `<tr><td><b>${esc(p.abbr)}</b></td><td>${esc(p.nickname)}</td><td>${esc(p.kind)}</td>
      <td><button class="btn btn-sm" onclick="openEmpRules('${esc(p.id)}')">${ico('edit')} แก้</button></td></tr>`).join('')}</table></div>`, null);

  $('main').innerHTML = h;
}

/* ---------- บันทึกทีละหมวด ---------- */
async function _save(section, data, reload) {
  try { await api('saveSettings', section, data); toast('บันทึกแล้ว'); }
  catch (e) { return toast(e.message); }
  if (reload) { setTimeout(() => location.reload(), 500); } else viewOrgSettings();
}
function saveOrgInfo() { _save('org', { name: _v('os_name'), color: _v('os_color'), logo: _v('os_logo') }, true); }
function saveBranches() {
  _save('branches', OS.branches.map(b => ({
    code: b.code, name: _v('bn_' + b.code), color: _v('bc_' + b.code), open_time: _v('bo_' + b.code), close_time: _v('bx_' + b.code),
    sun_open_time: _v('bs_' + b.code), pt_shift_start: _v('bp1_' + b.code), pt_shift_end: _v('bp2_' + b.code),
    scan_round_from: _v('br1_' + b.code), scan_round_to: _v('br2_' + b.code),
    lat: _v('bla_' + b.code), lng: _v('blo_' + b.code), checkin_radius_m: _v('brd_' + b.code)
  })), true);
}
function saveLeaveTypes() {
  _save('leaveTypes', OS.leaveTypes.map(l => ({ key: l.key, quota_days: _v('lq_' + l.key), half: _c('lh_' + l.key), active: _c('la_' + l.key) })));
}
function _grpRow(i, g) {
  return `<div class="row grow" style="gap:8px;margin-bottom:6px;align-items:center">
    <input class="gcode" value="${esc(g.code)}" ${g.code ? 'readonly' : ''} placeholder="รหัส" style="max-width:100px">
    <input class="glabel" value="${esc(g.label)}" placeholder="ชื่อที่แสดง">
    <label style="display:flex;gap:6px;align-items:center;white-space:nowrap"><input class="gph" type="checkbox" style="width:auto" ${g.is_pharm ? 'checked' : ''}> เภสัช</label></div>`;
}
function addGrpRow() { $('grpList').insertAdjacentHTML('beforeend', _grpRow(0, { code: '', label: '', is_pharm: false })); }
function saveGroups() {
  const rows = [...document.querySelectorAll('#grpList .grow')].map(r => ({
    code: r.querySelector('.gcode').value.trim(), label: r.querySelector('.glabel').value.trim(), is_pharm: r.querySelector('.gph').checked
  })).filter(g => g.code);
  _save('groups', rows);
}
function saveRules() {
  _save('rules', [
    { rule_key: 'pc_move', enabled: _c('rl_pc_on'), params: { abbr: _v('rl_pc_abbr'), pc_min: _v('rl_pc_min'), from_branch: _v('rl_pc_from'), to_branch: _v('rl_pc_to') } },
    { rule_key: 'branch_pharm', enabled: _c('rl_bp_on'), params: { abbr: _v('rl_bp_abbr'), branch: _v('rl_bp_br') } }
  ]);
}
function saveSettingGroup(g) {
  _save('settings', OS.settings.filter(s => s.group === g).map(s => ({ key: s.key, value: _v('st_' + s.key) })));
}

/* ---------- กฎรายบุคคล (หน้าต่างแก้) ---------- */
let ER = null;
async function openEmpRules(empId) {
  try { ER = await api('getEmpRules', empId); } catch (e) { return toast(e.message); }
  const canEdit = D.me.role === 'Admin';
  const ph = { close_time: ER.defaults.close_time, work_start: ER.defaults.work_start, break_minutes: ER.defaults.break_minutes, break_after_min: ER.defaults.break_after_min };
  $('modal').innerHTML = `<h3>กฎรายบุคคล · ${esc(ER.emp.abbr)} ${esc(ER.emp.nickname)}</h3>
    <p class="muted" style="font-size:12px">เว้นว่าง = ใช้ค่าเริ่มต้น (สาขา ${esc(ER.emp.branch || '-')} / ตั้งค่าร้าน)</p>
    ${ER.defs.map(d => {
      const v = ER.values[d.key], id = 'er_' + d.key;
      const p = ph[d.key] != null && ph[d.key] !== '' ? `placeholder="ค่าเริ่มต้น ${esc(ph[d.key])}"` : '';
      const dis = canEdit ? '' : 'disabled';
      if (d.type === 'split') {
        const sv = v && typeof v === 'object' ? v : null, br = ER.branches || [];
        const bsel = (sid, cur) => `<select id="${sid}" ${dis}>${br.map(b => `<option value="${esc(b.code)}" ${cur === b.code ? 'selected' : ''}>${esc(b.code)}</option>`).join('')}</select>`;
        const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        return `<div style="margin-top:14px;padding:10px;border:1px solid var(--line,#ddd);border-radius:10px">
          <label class="l" style="margin-top:0"><input type="checkbox" id="er_split_on" ${sv ? 'checked' : ''} ${dis} onchange="document.getElementById('er_split_box').hidden=!this.checked"> ${esc(d.label)}</label>
          <div id="er_split_box" ${sv ? '' : 'hidden'}>
            <div class="muted" style="font-size:12px;margin:4px 0">ทุกสัปดาห์ในวันที่เลือก: ตารางแสดงที่สาขาเช้า (นับกำลังคนทั้งสองสาขา) · คำนวณเป็น 1 วัน (เข้า=สแกนสาขาเช้า ออก=สแกนสาขาบ่าย) · แลกเวรในวันนั้นไม่ได้</div>
            <label class="l">วันในสัปดาห์</label><select id="er_split_wd" ${dis}>${days.map((n, i) => `<option value="${i}" ${sv && Number(sv.weekday) === i ? 'selected' : ''}>${n}</option>`).join('')}</select>
            <label class="l">สาขาเช้า (สแกนเข้า)</label>${bsel('er_split_ib', sv ? sv.in_branch : 'HE')}
            <label class="l">ต้องสแกนเข้าไม่เกิน</label>${_in('er_split_by', sv ? sv.in_by : '09:00', 'time', dis)}
            <label class="l">สาขาบ่าย (สแกนออก)</label>${bsel('er_split_ob', sv ? sv.out_branch : 'YA')}
            <label class="l">ปกติออกหลังเวลา (ออกก่อนได้ ไม่ปรับ)</label>${_in('er_split_after', sv ? sv.out_after : '20:00', 'time', dis)}
          </div></div>`;
      }
      if (d.type === 'bool') return `<label class="l">${esc(d.label)}</label><select id="${id}" ${dis}><option value="">ไม่ (ค่าเริ่มต้น)</option><option value="true" ${v === true ? 'selected' : ''}>ใช่</option></select>`;
      return `<label class="l">${esc(d.label)}</label>` + _in(id, v, d.type === 'number' ? 'number' : d.type === 'time' ? 'time' : d.type === 'month' ? 'month' : 'text', `${p} ${dis} ${d.type === 'number' ? 'step="any" min="0"' : ''}`);
    }).join('')}
    <div class="actions" style="margin-top:14px"><button class="btn btn-ghost" onclick="closeModal()">ปิด</button>${canEdit ? `<button class="btn btn-p" onclick="saveEmpRulesUi('${esc(empId)}')">${ico('device-floppy')} บันทึก</button>` : ''}</div>`;
  $('mbg').hidden = false;
}
async function saveEmpRulesUi(empId) {
  const values = {};
  ER.defs.forEach(d => {
    if (d.type === 'split') {
      values[d.key] = $('er_split_on').checked
        ? { weekday: Number($('er_split_wd').value), in_branch: $('er_split_ib').value, in_by: $('er_split_by').value, out_branch: $('er_split_ob').value, out_after: $('er_split_after').value }
        : null;
      return;
    }
    values[d.key] = _v('er_' + d.key);
  });
  try { await api('saveEmpRules', empId, values); toast('บันทึกแล้ว'); closeModal(); }
  catch (e) { toast(e.message); }
}

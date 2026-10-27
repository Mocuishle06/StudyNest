let data=Store.load();let pdfUrls={};const $=id=>document.getElementById(id),save=()=>Store.save(data),day=d=>{let x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`},today=day(new Date());$('today').textContent=today;$('planDeadline').value=day(new Date(Date.now()+7*86400000));function el(tag,text){let e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}function switchTab(name){for(let s of ['home','library','plan','focus'])$(s).classList.toggle('hidden',s!==name);document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));render()}document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>switchTab(b.dataset.go));function taskRow(t){let row=el('div');row.className='task'+(t.done?' done':'');let cb=el('input');cb.type='checkbox';cb.checked=t.done;cb.onchange=()=>{t.done=cb.checked;save();render()};let label=el('div');label.className='grow';label.append(el('span',t.name),el('small',`${t.date} · ${t.minutes} 分钟`));let del=el('button','删除');del.onclick=()=>{if(confirm('删除这项任务？')){data.tasks=data.tasks.filter(x=>x.id!==t.id);save();render()}};row.append(cb,label,del);return row}function render(){let todays=data.tasks.filter(t=>t.date===today),done=todays.filter(t=>t.done).length;let area=$('todayTasks');area.replaceChildren(...todays.map(taskRow));if(!todays.length)area.append(el('div','今天还没有任务，可以到「学习规划」生成。'));$('progressBar').style.width=(todays.length?done/todays.length*100:0)+'%';$('progressLabel').textContent=`今日完成 ${done} / ${todays.length}`;$('doneCount').textContent=data.tasks.filter(t=>t.done).length;$('focusCount').textContent=data.focusMinutes;$('homeCoins').textContent=data.coins;$('focusCoins').textContent=data.coins;$('plantLevel').textContent=1+Math.floor(data.focusMinutes/120);$('allTasks').replaceChildren(...data.tasks.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(taskRow));if(!data.tasks.length)$('allTasks').append(el('div','暂无计划'));let res=$('resources');res.replaceChildren();for(let r of data.resources){let row=el('div');row.className='task';let title=el('div');title.className='grow';title.append(el('strong',r.name),el('small',r.type==='pdf'?'PDF 文件':'网页链接'));let open=el('button','打开');open.onclick=()=>{let u=r.type==='pdf'?pdfUrls[r.id]:r.url;if(u)window.open(u,'_blank','noopener,noreferrer');else alert('PDF 文件未保存在浏览器中，请重新上传后打开。')};let del=el('button','删除');del.onclick=()=>{data.resources=data.resources.filter(x=>x.id!==r.id);if(pdfUrls[r.id])URL.revokeObjectURL(pdfUrls[r.id]);delete pdfUrls[r.id];save();render()};row.append(title,open,del);res.append(row)}if(!data.resources.length)res.append(el('div','暂无资料'));let select=$('focusTask'),v=select.value;select.replaceChildren(new Option('不关联任务',''),...data.tasks.filter(t=>!t.done).map(t=>new Option(`${t.name} (${t.date})`,t.id)));select.value=v}
$('resType').onchange=()=>{$('linkField').classList.toggle('hidden',$('resType').value==='pdf');$('pdfField').classList.toggle('hidden',$('resType').value!=='pdf')};$('addResource').onclick=()=>{let type=$('resType').value,name=$('resName').value.trim(),url=$('resUrl').value.trim(),file=$('resFile').files[0];if(!name)return alert('请填写资料名称');if(type==='link'&&!/^https?:\/\//i.test(url))return alert('请输入 http 或 https 开头的有效链接');if(type==='pdf'&&(!file||!(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf'))))return alert('请选择 PDF 文件');let id=crypto.randomUUID(),r={id,name,type,url:type==='link'?url:''};if(type==='pdf')pdfUrls[id]=URL.createObjectURL(file);data.resources.push(r);save();$('resName').value='';$('resUrl').value='';$('resFile').value='';render()};$('generate').onclick=()=>{let name=$('planName').value.trim(),total=Math.ceil(Number($('planMinutes').value)),deadline=$('planDeadline').value,cap=Number($('planIntensity').value);if(!name||!Number.isFinite(total)||total<=0||!deadline)return alert('请完整填写有效的任务信息');let start=new Date(today+'T12:00:00'),end=new Date(deadline+'T12:00:00'),n=Math.round((end-start)/86400000)+1;if(n<1)return alert('截止日期不能早于今天');if(n>365)return alert('第一版最多规划 365 天');let base=Math.floor(total/n),rem=total%n;for(let i=0;i<n;i++){let m=base+(i<rem?1:0);if(m)data.tasks.push({id:crypto.randomUUID(),name,date:day(new Date(start.getTime()+i*86400000)),minutes:m,done:false})}save();$('planMessage').textContent=`已生成 ${Math.min(total,n)} 天任务，每日约 ${Math.ceil(total/n)} 分钟。${Math.ceil(total/n)>cap?'⚠️ 超过所选强度，请考虑延长期限。':'符合所选强度。'}（暂不考虑其他已有任务）`;render()};let duration=25*60,remaining=duration,endAt=null,interval=null,active=false,celebrateUntil=0;let mode='focus';
function syncRoom(){let isCelebrating=Date.now()<celebrateUntil;let roomMode=isCelebrating?'celebrate':active?(mode==='break'?'resting':'studying'):'idle';document.querySelectorAll('.room').forEach(room=>{room.dataset.mode=roomMode;room.querySelector('.pet-wrap').className='pet-wrap '+roomMode;let s=room.querySelector('.speech');s.textContent=roomMode==='celebrate'?'太棒啦！送你小金币 ✨':roomMode==='studying'?'我也在认真学习喵～':roomMode==='resting'?'休息一下，呼噜呼噜…':'今天也一起慢慢进步吧～'});$('homePetText').textContent=roomMode==='studying'?'小猫正在陪你学习！':roomMode==='resting'?'小猫也在休息～':'小猫正在等你一起学习～';$('petText').textContent=roomMode==='studying'?'安静学习中，猫猫正在陪伴你。':roomMode==='resting'?'休息时间，猫猫正在打盹。':roomMode==='celebrate'?'完成一轮！猫猫为你庆祝！':'小猫准备好和你一起学习啦！'}
function display(){let secs=active?Math.max(0,Math.ceil((endAt-Date.now())/1000)):remaining;$('clock').textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;syncRoom();document.querySelectorAll('[data-duration]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.duration)*60===duration))}
function stop(){if(interval)clearInterval(interval);interval=null;active=false}
function tick(){remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));if(remaining<=0){stop();if(mode==='focus'){data.focusMinutes+=duration/60;data.coins+=Math.max(1,Math.round(duration/60));data.sessions++;save();render()}celebrateUntil=Date.now()+3800;display();setTimeout(syncRoom,3900);alert(mode==='focus'?`完成一轮专注！获得 ${Math.max(1,Math.round(duration/60))} 枚金币 🪙`:'休息结束，可以开始下一轮啦！')}else display()}
$('startTimer').onclick=()=>{if(active)return;endAt=Date.now()+remaining*1000;active=true;interval=setInterval(tick,500);display()};$('pauseTimer').onclick=()=>{if(active){remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));stop();display()}};$('resetTimer').onclick=()=>{stop();remaining=duration;display()};document.querySelectorAll('[data-duration]').forEach(b=>b.onclick=()=>{stop();duration=Number(b.dataset.duration)*60;mode=duration===5*60?'break':'focus';remaining=duration;display()});document.addEventListener('visibilitychange',()=>{if(active)tick()});render();display();

/* 云端接入：未启用时是空操作，不影响本地模式 */
if (window.CloudSync) CloudSync.boot();

/* ===== 提前结束：可以中途停止，但本轮不计入记录、不发金币（保留督促感） ===== */
(function () {
  let row = $('resetTimer') && $('resetTimer').parentNode;
  if (!row || $('endEarly')) return;
  let endBtn = el('button', '提前结束');
  endBtn.id = 'endEarly'; endBtn.type = 'button';
  endBtn.onclick = () => {
    if (!active) return;
    stop(); remaining = duration; display();
    alert('本轮已提前结束：不计入专注记录、不获得金币 🍂\n坚持到 00:00 才算完成一轮哦，加油！');
  };
  row.appendChild(endBtn);
})();

/* ===== 学习月历：像日历一样看每天的任务量（条长 + 颜色深浅 = 分钟数） ===== */
function cel(cls, text, tag) { let e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e }
let calBase = new Date(); calBase.setDate(1);
function renderCalendar() {
  if (!$('calGrid')) {
    let card = cel('card');
    card.appendChild(el('h2', '学习月历'));
    let head = cel('cal-head');
    let prev = el('button', '‹'), next = el('button', '›'), title = cel(null, null, 'strong'); title.id = 'calTitle';
    prev.type = next.type = 'button';
    prev.onclick = () => { calBase.setMonth(calBase.getMonth() - 1); renderCalendar(); };
    next.onclick = () => { calBase.setMonth(calBase.getMonth() + 1); renderCalendar(); };
    head.append(prev, title, next); card.appendChild(head);
    let grid = cel('cal-grid'); grid.id = 'calGrid'; card.appendChild(grid);
    card.appendChild(cel('hint', '色块越深、条越长 = 当日计划分钟数越多；划掉的是已完成。用两侧箭头翻月份。', 'p'));
    let allCard = $('allTasks').closest('.card');
    allCard.parentNode.insertBefore(card, allCard);
  }
  let y = calBase.getFullYear(), m = calBase.getMonth();
  $('calTitle').textContent = `${y} 年 ${m + 1} 月`;
  let startDow = (new Date(y, m, 1).getDay() + 6) % 7;          // 周一开头
  let days = new Date(y, m + 1, 0).getDate();
  let byDay = {};
  data.tasks.forEach(t => { (byDay[t.date] = byDay[t.date] || []).push(t); });
  let maxMin = Math.max(30, ...data.tasks.map(t => t.minutes || 0));
  let grid = $('calGrid'); grid.replaceChildren();
  ['一', '二', '三', '四', '五', '六', '日'].forEach(d => grid.appendChild(cel('cal-dow', d)));
  for (let i = 0; i < startDow; i++) grid.appendChild(cel('cal-cell empty'));
  for (let dnum = 1; dnum <= days; dnum++) {
    let ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(dnum).padStart(2, '0')}`;
    let cell = cel('cal-cell' + (ds === today ? ' cal-today' : ''));
    cell.appendChild(cel('cal-num', dnum));
    (byDay[ds] || []).forEach(t => {
      let mins = t.minutes || 0;
      let chip = cel('cal-chip ' + (mins > 90 ? 'cal-hi' : mins > 30 ? 'cal-mid' : 'cal-low') + (t.done ? ' cal-done' : ''), `${t.name} ${mins}′`);
      chip.style.width = Math.max(40, Math.round(mins / maxMin * 100)) + '%';
      chip.title = `${t.name}：${mins} 分钟${t.done ? '（已完成）' : ''}`;
      cell.appendChild(chip);
    });
    grid.appendChild(cell);
  }
}
const __renderWithoutCalendar = render;
render = function () { __renderWithoutCalendar(); renderCalendar(); };
renderCalendar();

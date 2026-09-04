/*
 * 建築ノード 建築計算用スクリプト
 *
 * calculator.html の計算処理をここにまとめています。
 * HTML側の id と同じ名前を使っているので、どの入力を読んでいるか追いやすくしています。
 */

const $=id=>document.getElementById(id);
const n=id=>Number($(id).value);
const fmt=x=>Number.isFinite(x)?x.toLocaleString('ja-JP',{maximumFractionDigits:3}):'—';
const valid=(...v)=>v.every(x=>Number.isFinite(x)&&x>=0);
function calcArea(){const w=n('areaW'),d=n('areaD');if(!valid(w,d)||w===0||d===0){$('areaResult').textContent='幅と奥行を入力してください。';return;}$('areaResult').innerHTML=`<span class="big">${fmt(w*d)} m²</span><br>＝ ${fmt(w*d*10000)} cm²`}
function calcVolume(){const w=n('volW'),d=n('volD'),h=n('volH');if(!valid(w,d,h)||w===0||d===0||h===0){$('volResult').textContent='幅・奥行・高さを入力してください。';return;}const v=w*d*h;$('volResult').innerHTML=`<span class="big">${fmt(v)} m³</span><br>＝ ${fmt(v*1000)} L`}
function calcTsubo(){const a=n('areaTsubo');if(!Number.isFinite(a)||a<0){$('tsuboResult').textContent='面積を入力してください。';return;}$('tsuboResult').innerHTML=`<span class="big">約 ${fmt(a/3.305785)} 坪</span><br>1坪 ≒ 3.305785 m²`}
function calcRates(){const s=n('siteArea'),b=n('buildingArea'),t=n('totalArea'),bl=n('buildingLimit'),fl=n('floorLimit');if(!valid(s,b,t)||s<=0||b<0||t<0){$('ratesResult').textContent='敷地・建築・延べ面積を正しく入力してください。';return;}const c=b/s*100,v=t/s*100;let msg=`<span class="big">建ぺい率 ${fmt(c)} %</span><br><span class="big">容積率 ${fmt(v)} %</span>`;if(b>s||t<s)msg+=`<br><span class="warn">入力値の関係を確認してください。建築面積が敷地面積を超えていないか、延べ面積が敷地面積より極端に小さくなっていないか確認します。</span>`;if(Number.isFinite(bl)&&bl>0)msg+=`<br>指定建ぺい率 ${fmt(bl)} % → <span class="${c<=bl?'ok':'warn'}">${c<=bl?'上限以内':'上限超過'}</span>`;if(Number.isFinite(fl)&&fl>0)msg+=`<br>指定容積率 ${fmt(fl)} % → <span class="${v<=fl?'ok':'warn'}">${v<=fl?'上限以内':'上限超過'}</span>`;$('ratesResult').innerHTML=msg}
function calcStair(){const h=n('floorHeight'),target=n('riserInput'),t=n('treadInput');if(!valid(h,target,t)||h<=0||target<=0||t<=0){$('stairResult').textContent='階高・目標蹴上・踏面を正しく入力してください。';return;}const standards={other:{riser:220,tread:210,width:750,label:'一般（上記以外）'},housing:{riser:230,tread:150,width:750,label:'住宅の住戸内'},large:{riser:200,tread:240,width:1200,label:'多数の者が利用・大規模用途等'},school:{riser:180,tread:260,width:1400,label:'学校・劇場・集会場等'},elementary:{riser:160,tread:260,width:1400,label:'小学校の児童用'}};const st=standards[$('stairType').value];const steps=Math.max(1,Math.round(h/target));const r=h/steps;const treadCount=Math.max(steps-1,0);const run=treadCount*t;const comfort=2*r+t;const slope=r/t;const riserOK=r<=st.riser;const treadOK=t>=st.tread;const comfortOK=comfort>=550&&comfort<=650;let status=`<br>2R+T：${fmt(comfort)} mm → <span class="${comfortOK?'ok':'warn'}">${comfortOK?'550〜650mmの範囲':'範囲外'}</span>`;$('stairResult').innerHTML=`段数：<span class="big">${steps} 段</span><br>実際の蹴上：${fmt(r)} mm → <span class="${riserOK?'ok':'warn'}">${riserOK?'代表基準以内':'代表基準超過'}</span><br>踏面：${fmt(t)} mm → <span class="${treadOK?'ok':'warn'}">${treadOK?'代表基準以上':'代表基準未満'}</span><br>踏面数（直階段の簡易計算）：${treadCount} 段<br>水平距離：約 ${fmt(run)} mm<br>勾配：${fmt(slope)}（蹴上÷踏面）${status}<br><span class="hint">選択区分の代表値：蹴上 ${st.riser}mm以下・踏面 ${st.tread}mm以上・幅 ${st.width}mm以上。幅は未入力なので判定していません。用途の適用条件や踊場等は別途確認してください。</span>`}
function calcDaylight(){const w=n('windowArea'),f=n('floorArea'),target=n('daylightTarget');if(!valid(w,f,target)||f<=0){$('daylightResult').textContent='開口面積・床面積を正しく入力してください。';return;}const ratio=w/f*100,need=f*target/100,ok=ratio>=target;const targetLabel=target<11?'1/10（10%）':'1/7（約14.29%）';$('daylightResult').innerHTML=`開口面積比：<span class="big">${fmt(ratio)} %</span><br>比較基準：${targetLabel}<br>必要な開口面積：${fmt(need)} m²<br><span class="${ok?'ok':'warn'}">${ok?'選択した比率以上です。':'選択した比率未満です。'}</span>`}
function calcShadow(){const h=n('shadowHeight'),a=n('solarAltitude');if(!Number.isFinite(h)||h<=0||!Number.isFinite(a)||a<=0||a>=90){$('shadowResult').textContent='建物高さと0〜90°の太陽高度を入力してください。';return;}const len=h/Math.tan(a*Math.PI/180);$('shadowResult').innerHTML=`影の長さ：<span class="big">約 ${fmt(len)} m</span>`}
const dimensions=[
['廊下','計画幅','動線','用途・避難・バリアフリー条件で決定','固定値ではなく、用途・人数・避難経路・バリアフリー条件から有効幅を決めます。','廊下 通路 動線'],
['階段','蹴上・踏面・幅','階段','代表値：75 / 120 / 140cmなど用途別に確認','建築基準法施行令23条などで階段の種類に応じた基準があります。用途を先に決めてから確認します。','階段 蹴上 踏面 幅'],
['ドア','有効開口・扉軌跡','建具','有効開口幅＋扉の開閉範囲','家具搬入・避難・車いす利用を考え、開き戸の回転半径や引き戸の通行上有効な幅も図面で確認します。','ドア 扉 建具 開口'],
['駐車場','車室・通路・切り返し','車','車種に合わせて設定','車幅だけで決めず、乗降・前面道路・切り返し・壁との離隔まで含めて計画します。','駐車場 車 車室'],
['バリアフリー','有効幅・回転・段差','動線','用途・条例・経路条件で確認','移動等円滑化経路などの対象では、廊下・出入口・段差・手すり等に具体的な基準があります。用途と適用法令を確認します。','バリアフリー 車いす 回転'],
['天井高さ','仕上げ面からの高さ','室内','構造・設備・用途から決定','梁せい、設備、照明、換気、建具との干渉を確認し、必要な天井ふところも検討します。','天井 高さ 梁 設備'],
['柱スパン','柱間の距離','構造','用途・構造形式から設定','構造安全性だけでなく、梁せい、設備、部屋の使い方、駐車計画とのバランスで決めます。','スパン 柱 構造'],
['家具搬入','通過寸法・曲がり角','車','最大寸法＋経路の余裕','入口だけでなく、廊下・扉・階段・エレベーター・曲がり角を連続して確認します。','家具 搬入 廊下'],
['洗面・トイレ','設備寸法・動作範囲','水回り','設備＋人の動き＋扉の開閉','便器・洗面器の寸法だけでなく、立ち座り・介助・扉の軌跡を重ねて計画します。','トイレ 洗面 水回り']
];
let dimensionFilter='all';
function renderDimensions(){const q=$('dimensionQuery').value.trim().toLowerCase();const hits=dimensions.filter(x=>{const text=(x[0]+' '+x[1]+' '+x[2]+' '+x[3]+' '+x[4]+' '+x[5]).toLowerCase();const matchesQuery=!q||text.includes(q);const matchesFilter=dimensionFilter==='all'||x[2]===dimensionFilter||x[5].includes(dimensionFilter);return matchesQuery&&matchesFilter});$('dimensionResult').innerHTML=hits.map(x=>`<article class="dimension-card"><div class="dimension-card-top"><span class="dimension-category">${x[2]}</span><span class="dimension-arrow">↗</span></div><h3>${x[0]}</h3><div class="dimension-value"><span>${x[1]}</span><strong>${x[3]}</strong></div><p>${x[4]}</p><details><summary>考え方を見る</summary><div class="detail-text">${x[4]}</div></details></article>`).join('')||'<div class="dimension-empty">該当する項目がありません。キーワードや分類を変えてください。</div>'}
function searchDimensions(){renderDimensions()}
function filterDimensions(filter,button){dimensionFilter=filter;document.querySelectorAll('.dimension-filter').forEach(b=>b.classList.remove('active'));button.classList.add('active');renderDimensions()}

const terms={
'スパン':'柱・壁などの支点間の距離。構造計画でよく使います。','梁':'床や屋根などからの荷重を支える横架材。','GL':'Ground Level。地盤面の基準を示す記号として使われます。','FL':'Floor Level。床の高さ・仕上げ面の基準を示す記号として使われます。','SL':'Slab Level。スラブの高さを示す記号として使われます。','RC':'Reinforced Concrete。鉄筋コンクリート造。','S造':'Steel。鉄骨造。','SRC造':'Steel Reinforced Concrete。鉄骨鉄筋コンクリート造。','耐力壁':'地震・風などの水平力に抵抗するための壁。','矩計図':'建物の断面、高さ、納まりなどを詳しく示す図面。','建ぺい率':'敷地面積に対する建築面積の割合。','容積率':'敷地面積に対する延べ面積の割合。','PS':'パイプスペース。給排水などの配管スペース。','EPS':'電気設備などの配線・配管スペースとして使われる区画。'};
function searchTerms(){const q=$('termQuery').value.trim().toLowerCase();const hits=Object.entries(terms).filter(([k,v])=>(k+' '+v).toLowerCase().includes(q));$('termResult').innerHTML=hits.map(([k,v])=>`<div class="term-item"><strong>${k}</strong>${v}</div>`).join('')||'<div class="term-item">該当する用語がありません。</div>'}
function convertUnit(){const v=n('unitValue');if(!Number.isFinite(v)){ $('unitResult').textContent='数値を入力してください。';return;}const m=$('unitMode').value;const map={'mm-cm':[v/10,'cm'],'cm-mm':[v*10,'mm'],'cm-m':[v/100,'m'],'m-cm':[v*100,'cm'],'m-mm':[v*1000,'mm'],'mm-m':[v/1000,'m'],'m2-tsubo':[v/3.305785,'坪'],'tsubo-m2':[v*3.305785,'m²'],'m3-l':[v*1000,'L'],'l-m3':[v/1000,'m³']};const r=map[m];$('unitResult').innerHTML=`<span class="big">${fmt(r[0])} ${r[1]}</span>`}
searchDimensions();searchTerms();
['areaW','areaD'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')calcArea()}));
['volW','volD','volH'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')calcVolume()}));
['siteArea','buildingArea','totalArea','buildingLimit','floorLimit'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')calcRates()}));

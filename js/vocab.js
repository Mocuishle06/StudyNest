/* StudyNest 背单词
 * 词库：四级 / 六级 / 雅思（内置常用高频词，可继续往里加）
 * 算法：简化 Leitner 盒（0-3），答对升盒，间隔 1/3/7/15 天；答错回盒 0，10 分钟后重现
 * 数据：data.vocab（跟随 Store 自动本地保存 + 云端同步）
 * 依赖：app.js 里的 data / save / switchTab / render（同页面全局作用域）
 */
(function () {
  'use strict';

  /* ---------------- 词库 ---------------- */
  var BANKS = {
    cet4: {
      name: '四级核心',
      words: [
        { w: 'abandon', p: '/əˈbændən/', cn: 'v. 放弃；抛弃', ex: 'Never abandon your dream.', ez: '永远不要放弃你的梦想。' },
        { w: 'ability', p: '/əˈbɪləti/', cn: 'n. 能力；才能', ex: 'She has the ability to solve hard problems.', ez: '她有解决难题的能力。' },
        { w: 'absorb', p: '/əbˈzɔːb/', cn: 'v. 吸收；专心于', ex: 'Plants absorb water through roots.', ez: '植物通过根吸收水分。' },
        { w: 'academic', p: '/ˌækəˈdemɪk/', cn: 'adj. 学术的；n. 大学教师', ex: 'Academic writing needs clear structure.', ez: '学术写作需要清晰的结构。' },
        { w: 'accelerate', p: '/əkˈseləreɪt/', cn: 'v. 加速；促进', ex: 'The train accelerated smoothly.', ez: '火车平稳地加速了。' },
        { w: 'access', p: '/ˈækses/', cn: 'n. 通道；使用权 v. 访问', ex: 'You can access the library online.', ez: '你可以在线访问图书馆。' },
        { w: 'accompany', p: '/əˈkʌmpəni/', cn: 'v. 陪伴；伴随', ex: "I'll accompany you to the station.", ez: '我陪你去车站。' },
        { w: 'accomplish', p: '/əˈkʌmplɪʃ/', cn: 'v. 完成；实现', ex: 'She accomplished the task on time.', ez: '她按时完成了任务。' },
        { w: 'accurate', p: '/ˈækjərət/', cn: 'adj. 准确的；精确的', ex: 'Please give an accurate answer.', ez: '请给出准确的答案。' },
        { w: 'achieve', p: '/əˈtʃiːv/', cn: 'v. 达成；取得', ex: 'He achieved his goal at last.', ez: '他终于达成了目标。' },
        { w: 'acquire', p: '/əˈkwaɪə(r)/', cn: 'v. 获得；习得', ex: 'Children acquire language quickly.', ez: '孩子习得语言很快。' },
        { w: 'adapt', p: '/əˈdæpt/', cn: 'v. 适应；改编', ex: 'It takes time to adapt to a new city.', ez: '适应新城市需要时间。' },
        { w: 'adequate', p: '/ˈædɪkwət/', cn: 'adj. 足够的；恰当的', ex: 'Make sure you get adequate sleep.', ez: '确保你有足够的睡眠。' },
        { w: 'adjust', p: '/əˈdʒʌst/', cn: 'v. 调整；适应', ex: 'Adjust the chair to a comfortable height.', ez: '把椅子调到舒服的高度。' },
        { w: 'admire', p: '/ədˈmaɪə(r)/', cn: 'v. 钦佩；欣赏', ex: 'I admire her patience.', ez: '我钦佩她的耐心。' },
        { w: 'adopt', p: '/əˈdɒpt/', cn: 'v. 采用；收养', ex: 'They adopted a new teaching method.', ez: '他们采用了新的教学方法。' },
        { w: 'advantage', p: '/ədˈvɑːntɪdʒ/', cn: 'n. 优势；好处', ex: 'Small classes have many advantages.', ez: '小班教学有很多好处。' },
        { w: 'advocate', p: '/ˈædvəkeɪt/', cn: 'v. 提倡 n. 拥护者', ex: 'Many doctors advocate regular exercise.', ez: '很多医生提倡规律运动。' },
        { w: 'affect', p: '/əˈfekt/', cn: 'v. 影响；侵袭', ex: 'Lack of sleep affects memory.', ez: '睡眠不足会影响记忆。' },
        { w: 'afford', p: '/əˈfɔːd/', cn: 'v. 负担得起', ex: "We can't afford a new car now.", ez: '我们现在买不起新车。' },
        { w: 'agenda', p: '/əˈdʒendə/', cn: 'n. 议程；待办事项', ex: 'The agenda has three items.', ez: '议程有三项。' },
        { w: 'alter', p: '/ˈɔːltə(r)/', cn: 'v. 改变；改动', ex: 'Nothing can alter the fact.', ez: '没有什么能改变这个事实。' },
        { w: 'ambiguous', p: '/æmˈbɪɡjuəs/', cn: 'adj. 模棱两可的', ex: 'His answer was ambiguous.', ez: '他的回答模棱两可。' },
        { w: 'analyze', p: '/ˈænəlaɪz/', cn: 'v. 分析', ex: "Let's analyze the data first.", ez: '我们先分析数据。' },
        { w: 'ancient', p: '/ˈeɪnʃənt/', cn: 'adj. 古代的；古老的', ex: 'We visited an ancient temple.', ez: '我们参观了一座古庙。' },
        { w: 'announce', p: '/əˈnaʊns/', cn: 'v. 宣布；通告', ex: 'They announced the results today.', ez: '他们今天公布了结果。' },
        { w: 'annual', p: '/ˈænjuəl/', cn: 'adj. 每年的', ex: 'The annual meeting is in May.', ez: '年会在五月举行。' },
        { w: 'anticipate', p: '/ænˈtɪsɪpeɪt/', cn: 'v. 预料；期待', ex: 'We anticipate a busy week.', ez: '我们预计这周会很忙。' },
        { w: 'apparent', p: '/əˈpærənt/', cn: 'adj. 明显的；表面上的', ex: 'The reason is apparent to everyone.', ez: '原因对每个人都很明显。' },
        { w: 'appeal', p: '/əˈpiːl/', cn: 'v./n. 吸引；呼吁', ex: 'The idea appeals to young people.', ez: '这个想法吸引了年轻人。' },
        { w: 'appreciate', p: '/əˈpriːʃieɪt/', cn: 'v. 感激；欣赏', ex: 'I appreciate your help.', ez: '我很感谢你的帮助。' },
        { w: 'approach', p: '/əˈprəʊtʃ/', cn: 'n. 方法 v. 接近', ex: 'Try a different approach.', ez: '换个方法试试。' },
        { w: 'appropriate', p: '/əˈprəʊpriət/', cn: 'adj. 合适的；恰当的', ex: 'Wear appropriate clothes for the weather.', ez: '穿适合天气的衣服。' },
        { w: 'approve', p: '/əˈpruːv/', cn: 'v. 批准；赞成', ex: 'The plan was approved.', ez: '计划被批准了。' },
        { w: 'arrangement', p: '/əˈreɪndʒmənt/', cn: 'n. 安排；布置', ex: "Let's make arrangements for the trip.", ez: '我们来安排这次旅行吧。' },
        { w: 'aspect', p: '/ˈæspekt/', cn: 'n. 方面；外观', ex: 'Consider every aspect of the problem.', ez: '考虑问题的每个方面。' },
        { w: 'assess', p: '/əˈses/', cn: 'v. 评估；估价', ex: "Teachers assess students' progress.", ez: '老师评估学生的进步。' },
        { w: 'assume', p: '/əˈsjuːm/', cn: 'v. 假定；承担', ex: "Don't assume you are right.", ez: '别假定自己是对的。' },
        { w: 'attitude', p: '/ˈætɪtjuːd/', cn: 'n. 态度；看法', ex: 'A positive attitude helps a lot.', ez: '积极的态度很有帮助。' },
        { w: 'available', p: '/əˈveɪləbl/', cn: 'adj. 可用的；有空的', ex: 'The book is available online.', ez: '这本书网上可以找到。' }
      ]
    },
    cet6: {
      name: '六级进阶',
      words: [
        { w: 'abolish', p: '/əˈbɒlɪʃ/', cn: 'v. 废除；取消', ex: 'The law was abolished last year.', ez: '那条法律去年被废除。' },
        { w: 'abrupt', p: '/əˈbrʌpt/', cn: 'adj. 突然的；生硬的', ex: 'The car came to an abrupt stop.', ez: '车突然停了下来。' },
        { w: 'absurd', p: '/əbˈsɜːd/', cn: 'adj. 荒谬的；可笑的', ex: 'The idea sounds absurd.', ez: '这个想法听起来很荒谬。' },
        { w: 'accumulate', p: '/əˈkjuːmjəleɪt/', cn: 'v. 积累；堆积', ex: 'Dust accumulates quickly here.', ez: '这里灰尘积得很快。' },
        { w: 'acute', p: '/əˈkjuːt/', cn: 'adj. 急性的；敏锐的', ex: 'She felt acute pain in her back.', ez: '她背部一阵剧痛。' },
        { w: 'adhere', p: '/ədˈhɪə(r)/', cn: 'v. 坚持；黏附', ex: 'We adhere to the safety rules.', ez: '我们遵守安全规则。' },
        { w: 'adjacent', p: '/əˈdʒeɪsnt/', cn: 'adj. 邻近的；毗连的', ex: 'The hotel is adjacent to the park.', ez: '酒店紧邻公园。' },
        { w: 'administer', p: '/ədˈmɪnɪstə(r)/', cn: 'v. 管理；施行', ex: 'Nurses administer the vaccine.', ez: '护士负责注射疫苗。' },
        { w: 'adverse', p: '/ˈædvɜːs/', cn: 'adj. 不利的；有害的', ex: 'Adverse weather delayed the flight.', ez: '恶劣天气延误了航班。' },
        { w: 'aesthetic', p: '/iːsˈθetɪk/', cn: 'adj. 美学的；审美的', ex: 'The design has aesthetic value.', ez: '这个设计有美学价值。' },
        { w: 'alleviate', p: '/əˈliːvieɪt/', cn: 'v. 减轻；缓解', ex: 'The medicine alleviated her headache.', ez: '药减轻了她的头痛。' },
        { w: 'allocate', p: '/ˈæləkeɪt/', cn: 'v. 分配；拨给', ex: 'Allocate more time to reading.', ez: '给阅读分配更多时间。' },
        { w: 'amplify', p: '/ˈæmplɪfaɪ/', cn: 'v. 放大；增强', ex: 'The mic amplifies your voice.', ez: '麦克风会放大你的声音。' },
        { w: 'anonymous', p: '/əˈnɒnɪməs/', cn: 'adj. 匿名的', ex: 'He received an anonymous letter.', ez: '他收到一封匿名信。' },
        { w: 'arbitrary', p: '/ˈɑːbɪtrəri/', cn: 'adj. 任意的；专断的', ex: 'The rule seems arbitrary.', ez: '这条规则显得有些武断。' },
        { w: 'articulate', p: '/ɑːˈtɪkjuleɪt/', cn: 'v. 清晰表达 adj. 口齿清楚的', ex: 'She articulated her view clearly.', ez: '她清晰地表达了自己的观点。' },
        { w: 'ascertain', p: '/ˌæsəˈteɪn/', cn: 'v. 查明；确定', ex: 'We must ascertain the facts.', ez: '我们必须查明事实。' },
        { w: 'aspire', p: '/əˈspaɪə(r)/', cn: 'v. 渴望；向往', ex: 'She aspires to be a writer.', ez: '她渴望成为作家。' },
        { w: 'assemble', p: '/əˈsembl/', cn: 'v. 集合；组装', ex: 'Students assembled in the hall.', ez: '学生在礼堂集合。' },
        { w: 'assert', p: '/əˈsɜːt/', cn: 'v. 断言；维护', ex: 'He asserted his innocence.', ez: '他坚称自己无罪。' },
        { w: 'asset', p: '/ˈæset/', cn: 'n. 资产；优势', ex: 'Patience is a great asset.', ez: '耐心是一种很大的优势。' },
        { w: 'attain', p: '/əˈteɪn/', cn: 'v. 达到；获得', ex: 'She attained a high score.', ez: '她取得了高分。' },
        { w: 'attribute', p: '/əˈtrɪbjuːt/', cn: 'v. 归因于 n. 属性', ex: 'He attributes success to hard work.', ez: '他把成功归因于努力。' },
        { w: 'authentic', p: '/ɔːˈθentɪk/', cn: 'adj. 真正的；可信的', ex: 'This is an authentic painting.', ez: '这是一幅真迹。' },
        { w: 'autonomy', p: '/ɔːˈtɒnəmi/', cn: 'n. 自治；自主权', ex: 'Students need more autonomy.', ez: '学生需要更多自主权。' },
        { w: 'bias', p: '/ˈbaɪəs/', cn: 'n. 偏见；偏向', ex: 'Avoid bias in judging others.', ez: '评判他人时要避免偏见。' },
        { w: 'boost', p: '/buːst/', cn: 'v./n. 提升；推动', ex: 'Reading boosts vocabulary.', ez: '阅读能提升词汇量。' },
        { w: 'boundary', p: '/ˈbaʊndri/', cn: 'n. 边界；界限', ex: "Respect other people's boundaries.", ez: '尊重他人的边界。' },
        { w: 'boycott', p: '/ˈbɔɪkɒt/', cn: 'v./n. 抵制', ex: 'They boycotted the event.', ez: '他们抵制了那场活动。' },
        { w: 'coherent', p: '/kəʊˈhɪərənt/', cn: 'adj. 连贯的；一致的', ex: 'Write a coherent paragraph.', ez: '写一个连贯的段落。' },
        { w: 'compensate', p: '/ˈkɒmpenseɪt/', cn: 'v. 补偿；弥补', ex: 'Nothing can compensate for lost time.', ez: '什么都无法弥补失去的时间。' },
        { w: 'compile', p: '/kəmˈpaɪl/', cn: 'v. 编纂；汇编', ex: 'She compiled a reading list.', ez: '她汇编了一份书单。' },
        { w: 'comprehensive', p: '/ˌkɒmprɪˈhensɪv/', cn: 'adj. 全面的；综合的', ex: 'We need a comprehensive plan.', ez: '我们需要一个全面的计划。' },
        { w: 'conceive', p: '/kənˈsiːv/', cn: 'v. 构想；怀有', ex: 'He conceived the idea in college.', ez: '他在大学时构想出这个点子。' },
        { w: 'condemn', p: '/kənˈdem/', cn: 'v. 谴责；判刑', ex: 'The world condemned the attack.', ez: '全世界谴责这次袭击。' },
        { w: 'confine', p: '/kənˈfaɪn/', cn: 'v. 限制；禁闭', ex: 'Confine your answer to one page.', ez: '把答案限制在一页以内。' }
      ]
    },
    ielts: {
      name: '雅思学术',
      words: [
        { w: 'hypothesis', p: '/haɪˈpɒθəsɪs/', cn: 'n. 假设；假说', ex: 'The data supports the hypothesis.', ez: '数据支持这个假设。' },
        { w: 'methodology', p: '/ˌmeθəˈdɒlədʒi/', cn: 'n. 方法论；研究方法', ex: 'The paper explains its methodology.', ez: '论文说明了它的研究方法。' },
        { w: 'phenomenon', p: '/fəˈnɒmɪnən/', cn: 'n. 现象', ex: 'Urban heat is a common phenomenon.', ez: '城市热岛是普遍现象。' },
        { w: 'criterion', p: '/kraɪˈtɪəriən/', cn: 'n. 标准（单数）', ex: 'Cost is a key criterion.', ez: '成本是关键标准。' },
        { w: 'paradigm', p: '/ˈpærədaɪm/', cn: 'n. 范式；典范', ex: 'The study marks a paradigm shift.', ez: '这项研究标志着范式转变。' },
        { w: 'empirical', p: '/ɪmˈpɪrɪkl/', cn: 'adj. 实证的；经验的', ex: 'There is little empirical evidence.', ez: '几乎没有实证证据。' },
        { w: 'qualitative', p: '/ˈkwɒlɪtətɪv/', cn: 'adj. 定性的', ex: 'They conducted qualitative interviews.', ez: '他们做了定性访谈。' },
        { w: 'quantitative', p: '/ˈkwɒntɪtətɪv/', cn: 'adj. 定量的', ex: 'Quantitative data are easier to compare.', ez: '定量数据更容易比较。' },
        { w: 'correlation', p: '/ˌkɒrəˈleɪʃn/', cn: 'n. 相关性；关联', ex: 'There is a strong correlation.', ez: '存在很强的相关性。' },
        { w: 'implication', p: '/ˌɪmplɪˈkeɪʃn/', cn: 'n. 影响；含义', ex: 'The findings have policy implications.', ez: '研究结果具有政策意义。' },
        { w: 'infrastructure', p: '/ˈɪnfrəstrʌktʃə(r)/', cn: 'n. 基础设施', ex: 'The city invested in infrastructure.', ez: '这座城市投资了基础设施。' },
        { w: 'sustainable', p: '/səˈsteɪnəbl/', cn: 'adj. 可持续的', ex: 'We need sustainable energy.', ez: '我们需要可持续能源。' },
        { w: 'consumption', p: '/kənˈsʌmpʃn/', cn: 'n. 消费；消耗', ex: 'Energy consumption keeps rising.', ez: '能源消耗持续上升。' },
        { w: 'distribution', p: '/ˌdɪstrɪˈbjuːʃn/', cn: 'n. 分配；分布', ex: 'The distribution of wealth is uneven.', ez: '财富分配不均。' },
        { w: 'migration', p: '/maɪˈɡreɪʃn/', cn: 'n. 迁移；迁徙', ex: 'Bird migration follows seasons.', ez: '鸟类迁徙随季节变化。' },
        { w: 'urbanization', p: '/ˌɜːbənaɪˈzeɪʃn/', cn: 'n. 城市化', ex: 'Urbanization changes rural life.', ez: '城市化改变乡村生活。' },
        { w: 'biodiversity', p: '/ˌbaɪəʊdaɪˈvɜːsəti/', cn: 'n. 生物多样性', ex: 'Forests protect biodiversity.', ez: '森林保护生物多样性。' },
        { w: 'ecosystem', p: '/ˈiːkəʊsɪstəm/', cn: 'n. 生态系统', ex: 'Wetlands are rich ecosystems.', ez: '湿地是丰富的生态系统。' },
        { w: 'emission', p: '/ɪˈmɪʃn/', cn: 'n. 排放；排放物', ex: 'Carbon emissions must fall.', ez: '碳排放必须下降。' },
        { w: 'renewable', p: '/rɪˈnjuːəbl/', cn: 'adj. 可再生的', ex: 'Solar is a renewable source.', ez: '太阳能是可再生能源。' },
        { w: 'curriculum', p: '/kəˈrɪkjələm/', cn: 'n. 课程设置', ex: 'The curriculum includes coding.', ez: '课程包含编程。' },
        { w: 'tuition', p: '/tjuˈɪʃn/', cn: 'n. 学费；教学', ex: 'Tuition fees rise each year.', ez: '学费每年上涨。' },
        { w: 'scholarship', p: '/ˈskɒləʃɪp/', cn: 'n. 奖学金；学识', ex: 'She won a full scholarship.', ez: '她获得了全额奖学金。' },
        { w: 'assessment', p: '/əˈsesmənt/', cn: 'n. 评估；考核', ex: 'Continuous assessment reduces stress.', ez: '持续评估能减轻压力。' },
        { w: 'compulsory', p: '/kəmˈpʌlsəri/', cn: 'adj. 强制的；必修的', ex: 'PE is compulsory in this school.', ez: '这所学校体育课是必修的。' },
        { w: 'vocational', p: '/vəʊˈkeɪʃənl/', cn: 'adj. 职业的；职业培训的', ex: 'Vocational training helps employment.', ez: '职业培训促进就业。' },
        { w: 'literacy', p: '/ˈlɪtərəsi/', cn: 'n. 读写能力；素养', ex: 'Digital literacy is essential.', ez: '数字素养至关重要。' },
        { w: 'nutrition', p: '/njuˈtrɪʃn/', cn: 'n. 营养', ex: 'Good nutrition supports learning.', ez: '良好的营养支持学习。' },
        { w: 'epidemic', p: '/ˌepɪˈdemɪk/', cn: 'n. 流行病 adj. 流行的', ex: 'The epidemic spread quickly.', ez: '流行病传播得很快。' },
        { w: 'diagnosis', p: '/ˌdaɪəɡˈnəʊsɪs/', cn: 'n. 诊断', ex: 'Early diagnosis saves lives.', ez: '早期诊断能挽救生命。' },
        { w: 'subsidy', p: '/ˈsʌbsədi/', cn: 'n. 补贴；津贴', ex: 'Farmers receive a subsidy.', ez: '农民获得补贴。' },
        { w: 'entrepreneur', p: '/ˌɒntrəprəˈnɜː(r)/', cn: 'n. 创业者；企业家', ex: 'Young entrepreneurs need support.', ez: '年轻创业者需要支持。' }
      ]
    }
  };

  var DAY = 86400000;
  var BOX_DAYS = [1, 3, 7, 15];       // 盒 0→1 天，1→3 天，2→7 天，3→15 天
  var GOALS = [10, 20, 30];
  var session = null;                 // { queue: [word], idx, reveal: false }
  var root = null;

  /* 统一入口：浏览器里能直接读到 app.js 的全局 data/save，测试或模块化环境下退回 window 暴露的引用 */
  function D() { return (typeof data !== 'undefined' && data) ? data : (window.studyData || null); }
  function doSave() {
    var fn = (typeof save === 'function') ? save : window.studySave;
    if (fn) { fn(); return; }
    if (typeof Store !== 'undefined' && D()) Store.save(D());
  }
  function redraw() {
    if (typeof render === 'function') render();
    else if (window.studyRender) window.studyRender();
  }

  function pad(n) { return ('0' + n).slice(-2); }
  function dayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function bank() { return BANKS[vocab().bank] || BANKS.cet4; }
  function key(w) { return w.w.toLowerCase(); }

  /* 取（并按需初始化）数据里的 vocab 段 */
  function vocab() {
    var d = D();
    if (!d) return { bank: 'cet4', goal: 10, learned: {}, today: null, todayCount: 0, streak: 0, lastDay: null, rewarded: null };
    if (!d.vocab || typeof d.vocab !== 'object') {
      d.vocab = { bank: 'cet4', goal: 10, learned: {}, today: null, todayCount: 0, streak: 0, lastDay: null, rewarded: null };
    }
    var v = d.vocab;
    if (!v.learned || typeof v.learned !== 'object') v.learned = {};
    return v;
  }

  function persist() { doSave(); }

  /* 跨天自动重置今日计数 */
  function rollDay() {
    var v = vocab(), t = dayStr();
    if (v.today !== t) {
      v.today = t;
      v.todayCount = 0;
    }
  }

  function touchStreak() {
    var v = vocab(), t = dayStr();
    if (v.lastDay === t) return;
    var y = dayStr(new Date(Date.now() - DAY));
    v.streak = (v.lastDay === y) ? (v.streak || 0) + 1 : 1;
    v.lastDay = t;
  }

  /* 组队列：先复习到期词，再补新词，总数 = 今日剩余目标 */
  function buildQueue() {
    var v = vocab(), words = bank().words, now = Date.now();
    var due = [], fresh = [];
    words.forEach(function (w) {
      var rec = v.learned[key(w)];
      if (!rec) fresh.push(w);
      else if (rec.box < 3 && rec.due <= now) due.push(w);
    });
    due.sort(function (a, b) { return (v.learned[key(a)].due || 0) - (v.learned[key(b)].due || 0); });
    var need = Math.max(0, v.goal - v.todayCount);
    return due.concat(fresh).slice(0, need);
  }

  function startSession() {
    rollDay();
    session = { queue: buildQueue(), idx: 0, reveal: false, again: {} };
    renderVocab();
  }

  function current() {
    return session && session.queue[session.idx] ? session.queue[session.idx] : null;
  }

  function answer(known) {
    var w = current();
    if (!w) return;
    var v = vocab(), k = key(w), t = dayStr();
    rollDay(); touchStreak();
    if (known) {
      var box = Math.min(3, ((v.learned[k] || {}).box || 0) + 1);
      v.learned[k] = { box: box, due: Date.now() + BOX_DAYS[Math.max(0, box - 1)] * DAY };
      v.todayCount = (v.todayCount || 0) + 1;
    } else {
      v.learned[k] = { box: 0, due: Date.now() + 10 * 60000 };
      /* 同一轮里最多再出现一次，避免死循环 */
      if (!session.again[k]) { session.again[k] = 1; session.queue.push(w); }
    }
    session.idx++;
    session.reveal = false;
    /* 达标奖励：每天一次，+2 金币 */
    if (v.todayCount >= v.goal && v.rewarded !== t) {
      v.rewarded = t;
      var d = D(); if (d) d.coins = (d.coins || 0) + 2;
    }
    persist();
    redraw();   // 同步首页金币/概览
    renderVocab();
  }

  function speak(w) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      var u = new SpeechSynthesisUtterance(w);
      u.lang = 'en-US'; u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* 无语音环境静默 */ }
  }

  /* ---------------- 渲染 ---------------- */
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderVocab() {
    if (!root) root = document.getElementById('vocab');
    if (!root) return;
    rollDay();
    var v = vocab(), b = bank();
    var total = b.words.length;
    var learnedCount = Object.keys(v.learned).length;
    var done = Math.min(v.todayCount || 0, v.goal);

    root.replaceChildren();

    /* 1. 今日任务 */
    var card = h('div', 'card');
    card.appendChild(h('h2', '今日单词'));
    var fields = h('div', 'fields');
    var f1 = h('div', 'field');
    f1.appendChild(h('label', undefined, '词库'));
    var selBank = h('select'); selBank.id = 'vBank';
    Object.keys(BANKS).forEach(function (k) {
      var o = h('option', undefined, BANKS[k].name + '（' + BANKS[k].words.length + ' 词）');
      o.value = k; if (k === v.bank) o.selected = true;
      selBank.appendChild(o);
    });
    selBank.onchange = function () { vocab().bank = selBank.value; session = null; persist(); renderVocab(); };
    f1.appendChild(selBank);
    var f2 = h('div', 'field');
    f2.appendChild(h('label', undefined, '每日目标'));
    var selGoal = h('select'); selGoal.id = 'vGoal';
    GOALS.forEach(function (g) {
      var o = h('option', undefined, g + ' 个词');
      o.value = String(g); if (g === v.goal) o.selected = true;
      selGoal.appendChild(o);
    });
    selGoal.onchange = function () { vocab().goal = Number(selGoal.value); session = null; persist(); renderVocab(); };
    f2.appendChild(selGoal);
    fields.append(f1, f2); card.appendChild(fields);

    var prog = h('div', 'progress');
    var bar = h('div', 'bar'); bar.style.width = (v.goal ? done / v.goal * 100 : 0) + '%';
    prog.appendChild(bar); card.appendChild(prog);
    card.appendChild(h('div', 'muted',
      '今日 ' + done + ' / ' + v.goal + ' 个 · 连续打卡 ' + (v.streak || 0) + ' 天 · 累计掌握 ' + learnedCount + ' / ' + total));

    var row = h('div', 'row'); row.style.marginTop = '10px';
    var btnStart = h('button', 'primary', done >= v.goal ? '今日已完成 ✓' : (session && current() ? '继续学习' : '开始背单词'));
    btnStart.type = 'button';
    btnStart.disabled = done >= v.goal;
    btnStart.onclick = startSession;
    row.appendChild(btnStart);
    if (v.todayCount > 0) {
      var btnReset = h('button', '重置今日进度');
      btnReset.type = 'button';
      btnReset.onclick = function () {
        if (!confirm('把今天的进度清零重新开始？（已掌握的词不会丢）')) return;
        vocab().todayCount = 0; vocab().rewarded = null; session = null; persist(); renderVocab();
      };
      row.appendChild(btnReset);
    }
    card.appendChild(row);
    card.appendChild(h('p', 'hint',
      '答「认识」后按 1 / 3 / 7 / 15 天的间隔安排复习；答「不认识」的词会在本轮稍后再出现一次，10 分钟后重新排队。完成每日目标奖励 2 枚金币。'));
    root.appendChild(card);

    /* 2. 单词卡 */
    var cardBox = h('div', 'card center');
    cardBox.appendChild(h('h2', '单词卡'));
    var w = current();
    if (!w) {
      var left = bank().words.filter(function (x) { return !v.learned[key(x)]; }).length;
      var tip = done >= v.goal
        ? '🎉 今天的目标完成啦，休息一下也很好。明天再来，或者把目标调高一点。'
        : (session && session.queue.length === 0 && left === 0
          ? '这个词库的词都学过一轮啦，明天再来复习（或换一个词库继续）。'
          : '准备好就开始吧 —— 今天还要学 ' + Math.max(0, v.goal - v.todayCount) + ' 个词。');
      cardBox.appendChild(h('p', 'vocab-empty', tip));
    } else {
      var pos = h('div', 'vocab-pos', '第 ' + (session.idx + 1) + ' / ' + session.queue.length + ' 个');
      cardBox.appendChild(pos);
      var flip = h('div', 'vocab-flip' + (session.reveal ? ' revealed' : ''));
      var front = h('div', 'vocab-face vocab-front');
      front.appendChild(h('div', 'vocab-word', w.w));
      front.appendChild(h('div', 'vocab-phon', w.p));
      var spk = h('button', 'vocab-spk', '🔊 听发音');
      spk.type = 'button';
      spk.onclick = function (e) { e.stopPropagation(); speak(w.w); };
      front.appendChild(spk);
      var back = h('div', 'vocab-face vocab-back');
      back.appendChild(h('div', 'vocab-cn', w.cn));
      back.appendChild(h('div', 'vocab-ex', w.ex));
      back.appendChild(h('div', 'vocab-ez', w.ez));
      flip.append(front, back);
      var tipEl = h('div', 'vocab-tip', session.reveal ? '点卡片可以再翻回正面' : '先自己想一想，点卡片看释义');
      flip.onclick = function () {
        session.reveal = !session.reveal;
        flip.classList.toggle('revealed', session.reveal);
        tipEl.textContent = session.reveal ? '点卡片可以再翻回正面' : '先自己想一想，点卡片看释义';
      };
      cardBox.appendChild(flip);
      cardBox.appendChild(tipEl);

      var acts = h('div', 'row'); acts.style.justifyContent = 'center'; acts.style.marginTop = '14px';
      var no = h('button', 'vocab-no', '不认识');
      no.type = 'button'; no.onclick = function () { answer(false); };
      var yes = h('button', 'primary vocab-yes', '认识 ✓');
      yes.type = 'button'; yes.onclick = function () { answer(true); };
      acts.append(no, yes); cardBox.appendChild(acts);
    }
    root.appendChild(cardBox);

    /* 3. 统计 */
    var stat = h('div', 'card');
    stat.appendChild(h('h2', '学习统计'));
    var r = h('div', 'row');
    [['累计掌握', learnedCount], ['连续打卡', (v.streak || 0) + ' 天'], ['今日已学', done], ['金币', (typeof data !== 'undefined' && data ? data.coins : 0)]]
      .forEach(function (it) {
        var box = h('div'); box.style.flex = '1';
        box.appendChild(h('div', 'stat', String(it[1])));
        box.appendChild(h('div', 'muted', it[0]));
        r.appendChild(box);
      });
    stat.appendChild(r);
    root.appendChild(stat);
  }

  /* 切到背单词页时渲染；同时暴露给外部（测试/调试） */
  window.Vocab = { render: renderVocab, start: startSession, answer: answer, bank: bank, vocab: vocab, BANKS: BANKS };
  if (typeof window.switchTab === 'function') {
    var orig = window.switchTab;
    window.switchTab = function (name) { orig(name); if (name === 'vocab') renderVocab(); };
  }
  renderVocab();
})();

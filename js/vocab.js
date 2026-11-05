/* StudyNest 背单词
 * 词库：四级核心 160 / 六级进阶 156 / 雅思学术 152（共 468 词）
 * 其中前 40/36/32 词为手写常用词，其余由公开词书数据整理：
 *   词条、音标、释义、例句来自开源词书 kajweb/dict（有道词书数据），
 *   难度按 OpenSubtitles 2018 英文 5 万词频表分档筛选，人工复核剔除过易/过冷僻词条。
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
        { w: 'available', p: '/əˈveɪləbl/', cn: 'adj. 可用的；有空的', ex: 'The book is available online.', ez: '这本书网上可以找到。' },
        { w: 'leading', p: '/ˈliːdɪŋ/', cn: 'adj. 主要的；领先的', ex: 'The army played a leading role in organizing the attempted coup.', ez: '军队在策划这场未遂政变的过程中起了最主要的作用。' },
        { w: 'charming', p: '/ˈtʃɑːmɪŋ/', cn: 'adj. 迷人的；可爱的', ex: 'Harry can be very charming.', ez: '哈里有时候很讨人喜欢。' },
        { w: 'anger', p: '/ˈæŋgə/', cn: 'n. 怒；愤怒 v. 使发怒', ex: 'There is growing anger among the people against the government.', ez: '民众对政府越来越不满。' },
        { w: 'negative', p: '/ˈnegətɪv/', cn: 'adj. 否定的；消极的', ex: 'Jean rarely sounded so negative about her mother.', ez: '琼很少这么说她母亲不好。' },
        { w: 'similar', p: '/ˈsɪmɪlə/', cn: 'adj. 相似的；类似的', ex: 'Both approaches seem to achieve similar results.', ez: '两种方法都得出了相似的结果。' },
        { w: 'collect', p: '/kəˈlekt/', cn: 'v. 收集；收款', ex: 'The company collects information about consumer trends.', ez: '这家公司搜集有关消费者趋向的信息。' },
        { w: 'passion', p: '/ˈpæʃ(ə)n/', cn: 'n. 激情；热情', ex: 'The issue arouses strong passions.', ez: '那件事激起了人们强烈的情绪。' },
        { w: 'curse', p: '/kɜːs/', cn: 'n. 诅咒；咒骂', ex: 'He believed that someone had put a curse on the house.', ez: '他相信有人对这房子下了诅咒。' },
        { w: 'hire', p: '/ˈhaɪə/', cn: 'v. 租借 n. 租用；雇用', ex: 'What does it cost to hire a boat for a week?', ez: '一艘小船租用一星期的费用是多少？' },
        { w: 'design', p: '/dɪˈzaɪn/', cn: 'v. 设计 n. 设计；图样', ex: 'The tower was designed by Gilbert Scott.', ez: '这座塔楼是吉尔伯特·斯科特设计的。' },
        { w: 'politics', p: '/ˈpɒlɪtɪks/', cn: 'n. 政治；政治学', ex: 'Politics have always interested Anita.', ez: '阿妮塔一直对政治感兴趣。' },
        { w: 'despite', p: '/dɪˈspaɪt/', cn: 'prep. 不管；不顾', ex: 'Liz realized that, despite herself, she cared about Edward.', ez: '利兹发现自己不由自主地在乎爱德华。' },
        { w: 'provide', p: '/prəˈvaɪd/', cn: 'v. 提供；装备', ex: 'Tea and biscuits will be provided.', ez: '有茶水和饼干供应。' },
        { w: 'seek', p: '/siːk/', cn: 'v. 寻找；探索', ex: 'Attractive woman, 27, seeks male, 25-35, for fun and friendship.', ez: '魅力女性，27岁，欲觅25-35岁男子为友，同玩共乐，发展友情。' },
        { w: 'earn', p: '/ɜːn/', cn: 'v. 赚得；挣得', ex: 'He did all sorts of jobs to earn a living.', ez: '他为谋生什么活都干。' },
        { w: 'fashion', p: '/ˈfæʃ(ə)n/', cn: 'n. 样子；方式', ex: 'Please leave the building in an orderly fashion.', ez: '请大家有秩序地离开大楼。' },
        { w: 'prize', p: '/praɪz/', cn: 'n. 奖赏；奖金 v. 珍视', ex: 'The first prize has gone to Dr John Gentle.', ez: '获得一等奖的是约翰·金特尔博士。' },
        { w: 'debt', p: '/det/', cn: 'n. 债；债务', ex: 'He had enough money to pay off his outstanding debts.', ez: '他有足够的钱偿还亏欠的债务。' },
        { w: 'circle', p: '/ˈsɜːk(ə)l/', cn: 'n. 圆；圆周', ex: 'Draw a circle 10cm in diameter.', ez: '画一个直径10厘米的圆形。' },
        { w: 'stock', p: '/stɒk/', cn: 'n. 原料；库存品', ex: 'When a nearby shop burned down, our stock was ruined by smoke.', ez: '附近一家商店被烧成灰烬，我们的存货也被浓烟熏坏了。' },
        { w: 'percent', p: '/pəˈsent/', cn: 'n. 百分之…', ex: 'At the end of the day, add up the percent DVs.', ez: '在一天结束后，把所有营养素的百分比加起来。' },
        { w: 'normally', p: '/ˈnɔːm(ə)lɪ/', cn: 'adv. 通常；正常地', ex: 'The journey normally takes about two hours.', ez: '这段旅程通常需要大约两小时。' },
        { w: 'education', p: '/edjʊˈkeɪʃ(ə)n/', cn: 'n. 教育；训导', ex: 'She also hopes her children will get a good education.', ez: '她也希望她的孩子可以受到良好的教育。' },
        { w: 'glory', p: '/ˈglɔːrɪ/', cn: 'n. 光荣；荣誉的事', ex: 'She dreamt of future glory as an Olympic champion.', ez: '她梦想着将来能得到奥运冠军的荣誉。' },
        { w: 'reputation', p: '/repjʊˈteɪʃ(ə)n/', cn: 'n. 名誉；名声', ex: 'Alice Munro has a reputation for being a very depressing writer.', ez: '艾丽斯•门罗有文风抑郁的名声。' },
        { w: 'confidence', p: '/ˈkɒnfɪd(ə)ns/', cn: 'n. 信任；信赖', ex: 'I felt I was doing well and my confidence began to grow.', ez: '我觉得自己干得不错，自信心就开始增加了。' },
        { w: 'beloved', p: '/bɪˈlʌvɪd/', cn: 'adj. 为…的爱的 n. 爱人', ex: 'He never recovered from the death of his beloved daughter.', ez: '他一直没有走出失去爱女的阴影。' },
        { w: 'actual', p: '/ˈæktʃʊəl/', cn: 'adj. 实际的；现行的', ex: 'Interest is only charged on the actual amount borrowed.', ez: '利息只按实际借款额收取。' },
        { w: 'mental', p: '/ˈment(ə)l/', cn: 'adj. 智力的；精神的', ex: 'Stress has an effect on both your physical and mental health.', ez: '压力对身体健康和心理健康都有影响。' },
        { w: 'secure', p: '/sɪˈkjʊə/', cn: 'adj. 安心的；安全的', ex: 'Companies can offer secure credit card transactions over the Internet.', ez: '公司可以提供安全的网上信用卡交易。' },
        { w: 'federal', p: '/ˈfed(ə)r(ə)l/', cn: 'adj. 联邦的；联盟的', ex: 'Switzerland is a federal republic.', ez: '瑞士是一个联邦共和国。' },
        { w: 'emotional', p: '/ɪˈməʊʃ(ə)n(ə)l/', cn: 'adj. 感情的；情绪的', ex: 'She provided emotional support at a very distressing time for me.', ez: '在我非常痛苦的时候，她是我的情感支柱。' },
        { w: 'commit', p: '/kəˈmɪt/', cn: 'v. 犯(错误)；干(坏事)', ex: 'Women commit fewer crimes than men.', ez: '女性犯罪比男性少。' },
        { w: 'extraordinary', p: '/ɪkˈstrɔːd(ə)n(ə)ri/', cn: 'adj. 非同寻常的；特别的', ex: 'It took an extraordinary amount of work.', ez: '这费了相当多的功夫。' },
        { w: 'opposite', p: '/ˈɒpəzɪt/', cn: 'adj. 对面的 n. 对立物', ex: 'I thought the medicine would make him sleep, but it had the opposite effect.', ez: '我以为这药会让他睡觉，但是它却起了反作用。' },
        { w: 'detail', p: '/ˈdiːteɪl/', cn: 'n. 细节；枝节', ex: 'This issue will be discussed in more detail in Chapter 5.', ez: '这个问题将在第五章里作更为详细的论述。' },
        { w: 'background', p: '/ˈbækgraʊnd/', cn: 'n. 背景；后景', ex: 'Do you know anything about his background?', ez: '关于他的背景，你知道什么吗？' },
        { w: 'agreement', p: '/əˈgriːm(ə)nt/', cn: 'n. 协定；协议', ex: 'It is easier for two parties to reach agreement than for three.', ez: '两方达成一致比三方达成一致容易。' },
        { w: 'culture', p: '/ˈkʌltʃə/', cn: 'n. 文化；文明', ex: 'In our culture, it is rude to ask someone how much they earn.', ez: '在我们的文化里，问别人收入多少是不礼貌的。' },
        { w: 'solid', p: '/ˈsɒlɪd/', cn: 'adj. 固体的 n. 固体', ex: 'It was good to be back on solid ground again.', ez: '又能踏上坚实的土地感觉真好。' },
        { w: 'naturally', p: '/ˈnætʃ(ə)rəlɪ/', cn: 'adv. 自然地；天然地', ex: 'Naturally enough, she wanted her child to grow up fit and strong.', ez: '很自然，她希望自己的孩子健康茁壮地成长。' },
        { w: 'attempt', p: '/əˈtem(p)t/', cn: 'v. 尝试；试图 n. 企图', ex: 'Weather conditions prevented them from attempting the jump.', ez: '天气状况使他们无法尝试跳伞。' },
        { w: 'gather', p: '/ˈgæðə/', cn: 'v. 聚集；集合vt收集', ex: 'A crowd gathered to watch the fight.', ez: '一群人聚拢来围观打架。' },
        { w: 'violent', p: '/ˈvaɪəl(ə)nt/', cn: 'adj. 猛烈的；狂暴的', ex: 'The riots ended in the violent deaths of three teenagers.', ez: '动乱以三名少年的惨死而告终。' },
        { w: 'childhood', p: '/ˈtʃaɪldhʊd/', cn: 'n. 童年；幼年', ex: 'I had a very happy childhood.', ez: '我的童年很快乐。' },
        { w: 'disaster', p: '/dɪˈzɑːstə/', cn: 'n. 灾难；灾祸', ex: 'The drought could spell disaster for wildlife.', ez: '干旱可能会对野生生物造成灾难。' },
        { w: 'heavily', p: '/ˈhevɪlɪ/', cn: 'adv. 重重地；大量地', ex: 'His wife was heavily pregnant at the time.', ez: '那时他妻子已经待产。' },
        { w: 'perform', p: '/pəˈfɔːm/', cn: 'v. 履行；执行', ex: 'The children perform two plays each school year.', ez: '孩子们一学年表演两部话剧。' },
        { w: 'crown', p: '/kraʊn/', cn: 'n. 王冠；冕', ex: 'How long does it take to have crowns fitted?', ez: '镶齿冠需要多长时间？' },
        { w: 'impressive', p: '/ɪmˈpresɪv/', cn: 'adj. 给人印象深刻的', ex: 'The figures certainly look impressive.', ez: '这些数字看上去确实很可观。' },
        { w: 'potential', p: '/pəˈtenʃl/', cn: 'adj. 潜在的 n. 潜力', ex: 'The company has identified 60 potential customers.', ez: '该公司已确定了60位潜在的客户。' },
        { w: 'delivery', p: '/dɪˈlɪv(ə)rɪ/', cn: 'n. 投递；交付', ex: 'Most Indian restaurants offer free delivery.', ez: '大多数印度餐馆提供免费外送服务。' },
        { w: 'advance', p: '/ədˈvɑːns/', cn: 'v. 前进；提高 n. 进展', ex: 'A line of US tanks slowly advanced.', ez: '一列美军坦克缓缓前进。' },
        { w: 'swing', p: '/swɪŋ/', cn: 'v. 摇摆；回转 n. 摇摆', ex: 'He was swinging his bag back and forth.', ez: '他前后甩动着他的包。' },
        { w: 'whistle', p: '/ˈwɪs(ə)l/', cn: 'n. 口哨 v. 吹口哨', ex: 'The lifeguard blew his whistle.', ez: '救生员吹响哨子。' },
        { w: 'deny', p: '/dɪˈnaɪ/', cn: 'v. 否定；拒绝相信', ex: 'The government denied the existence of poverty among 16- and 17-year-olds.', ez: '政府否认十六七岁的青少年当中存在贫困问题。' },
        { w: 'urgent', p: '/ˈɜːdʒənt/', cn: 'adj. 紧急的；强求的', ex: 'He was in urgent need of medical attention.', ez: '他急需治疗。' },
        { w: 'assure', p: '/əˈʃʊə/', cn: 'v. 使确信；向…保证', ex: 'The document is genuine, I can assure you.', ez: '我能向你保证，这文件是真的。' },
        { w: 'production', p: '/prəˈdʌkʃ(ə)n/', cn: 'n. 生产；产品', ex: "That model won't go into production before late 2007.", ez: '那种型号要到2007年底才会投入生产。' },
        { w: 'cruel', p: '/krʊəl/', cn: 'adj. 残忍的；残酷的', ex: 'Sometimes life seems unbearably cruel.', ez: '有时候生活残酷得让人无法承受。' },
        { w: 'mask', p: '/mɑːsk/', cn: 'n. 面具；伪装 v. 掩饰', ex: 'He was attacked and robbed by two people wearing masks.', ez: '他被两个蒙面人袭击并抢劫。' },
        { w: 'behave', p: '/bɪˈheɪv/', cn: 'v. 表现；举止', ex: 'She behaved in a very responsible way.', ez: '她表现得很有责任心。' },
        { w: 'bury', p: '/ˈberɪ/', cn: 'v. 埋葬；葬', ex: 'Electric cables are buried beneath the streets.', ez: '电缆埋在街道的下面。' },
        { w: 'channel', p: '/ˈtʃæn(ə)l/', cn: 'n. 海峡；渠道', ex: 'He changed channels to watch the basketball game.', ez: '他转换频道看篮球比赛。' },
        { w: 'quality', p: '/ˈkwɒlɪtɪ/', cn: 'n. 质量；品质', ex: 'Much of the land was of poor quality.', ez: '很多地的土质很差。' },
        { w: 'cheer', p: '/tʃɪə/', cn: 'v. 使振作；欢呼', ex: 'Everybody cheered when the firemen arrived.', ez: '消防员到达时，大家都欢呼起来。' },
        { w: 'flash', p: '/flæʃ/', cn: 'n. 闪光 v. 闪；闪烁', ex: 'Two flashes mean danger.', ez: '两次闪光表示危险。' },
        { w: 'tone', p: '/təʊn/', cn: 'n. 音；腔调', ex: 'Her tone was sharp with anger.', ez: '她很气愤，语气尖刻。' },
        { w: 'confess', p: '/kənˈfes/', cn: 'v. 供认；承认', ex: 'Torture was used and Fian confessed.', ez: '酷刑用过之后菲安就招供了。' },
        { w: 'demand', p: '/dɪˈmɑːnd/', cn: 'v. 要求；需要', ex: 'Angry demonstrators demanded the resignation of two senior officials.', ez: '愤怒的示威者要求两名高级官员辞职。' },
        { w: 'unknown', p: '/ʌnˈnəʊn/', cn: 'adj. 不知道的；未知的', ex: 'An unknown number of people were killed.', ez: '丧生人数不详。' },
        { w: 'suspicious', p: '/səˈspɪʃəs/', cn: 'adj. 怀疑的；可疑的', ex: 'She gave him a suspicious glance.', ez: '她向他投去怀疑的一瞥。' },
        { w: 'adult', p: '/ˈædʌlt/', cn: 'n. 成年人 adj. 成年的', ex: 'Some children find it difficult to talk to adults.', ez: '一些孩子觉得与大人很难谈得来。' },
        { w: 'steady', p: '/ˈstedɪ/', cn: 'adj. 稳固的 v. 使稳定', ex: 'Paul is making steady progress.', ez: '保罗逐渐在进步。' },
        { w: 'particularly', p: '/pəˈtɪkjʊləlɪ/', cn: 'adv. 特别；尤其', ex: 'Steve was in a particularly bad mood when he got back.', ez: '史蒂夫回来时情绪特别不好。' },
        { w: 'possibility', p: '/ˌpɒsɪˈbɪlɪtɪ/', cn: 'n. 可能；可能的事', ex: 'A peace settlement now looks like a real possibility.', ez: '达成和平协议现在看来有很大的可能性。' },
        { w: 'civil', p: '/ˈsɪv(ə)l/', cn: 'adj. 公民的；文职的', ex: 'They were married in a civil ceremony in May.', ez: '他们在五月份举行了世俗婚礼。' },
        { w: 'express', p: '/ɪkˈspres/', cn: 'v. 表示 n. 快车；快递', ex: 'She expressed an interest in seeing York.', ez: '她表示有兴趣见见约克。' },
        { w: 'miserable', p: '/ˈmɪz(ə)rəb(ə)l/', cn: 'adj. 痛苦的；悲惨的', ex: 'I spent the weekend feeling miserable.', ez: '我那个周末心情很糟糕。' },
        { w: 'argue', p: '/ˈɑːgjuː/', cn: 'v. 争论；争辩', ex: 'We could hear the neighbours arguing.', ez: '我们听到邻居在争吵。' },
        { w: 'trail', p: '/treɪl/', cn: 'n. 痕迹；小径 v. 跟踪', ex: 'The trail led over Boulder Pass before descending to a lake.', ez: '小路越过博尔德山口，然后向下通往湖边。' },
        { w: 'option', p: '/ˈɒpʃ(ə)n/', cn: 'n. 选择；选择权', ex: 'This was not the only option open to him.', ez: '这并非是他的唯一选择。' },
        { w: 'recall', p: '/rɪˈkɔːl/', cn: 'v. 回想；叫回', ex: 'As I recall, it was you who suggested this idea in the first place.', ez: '我记得，是你首先提出这个想法的。' },
        { w: 'customer', p: '/ˈkʌstəmə/', cn: 'n. 顾客；主顾', ex: 'We aim to offer good value and service to all our customers.', ez: '我们力求为所有的客户提供物有所值的商品和服务。' },
        { w: 'charity', p: '/ˈtʃærɪtɪ/', cn: 'n. 施舍；慈善事业', ex: 'All the money raised by the concert will go to charity.', ez: '音乐会筹得的钱款将全部用于慈善事业。' },
        { w: 'impression', p: '/ɪmˈpreʃ(ə)n/', cn: 'n. 印；印象', ex: 'When we looked around the school we got a very good impression.', ez: '我们参观了学校，对它的印象很好。' },
        { w: 'defeat', p: '/dɪˈfiːt/', cn: 'v. 战胜；击败', ex: 'They hoped to defeat the enemy at sea.', ez: '他们希望在海上击败敌人。' },
        { w: 'crisis', p: '/ˈkraɪsɪs/', cn: 'n. 危机；存亡之际', ex: 'The country now faces an economic crisis.', ez: '该国目前正面临一场经济危机。' },
        { w: 'mysterious', p: '/mɪˈstɪərɪəs/', cn: 'adj. 神秘的；难以理解的', ex: 'Benson later disappeared in mysterious circumstances.', ez: '本森后来就神秘地失踪了。' },
        { w: 'comfort', p: '/ˈkʌmfət/', cn: 'n. 舒适；安慰 v. 安慰', ex: 'I dress for comfort, not fashion.', ez: '我穿衣服只讲舒服，不追求时髦。' },
        { w: 'surrender', p: '/səˈrendə/', cn: 'v. 交出；投降', ex: 'Nadja had to fill out forms surrendering all rights to her property.', ez: '纳贾不得不填写表格，放弃对她财产的所有权利。' },
        { w: 'crush', p: '/krʌʃ/', cn: 'v. 压碎；碾碎', ex: 'His leg was crushed in the accident.', ez: '他的腿在事故中被压断。' },
        { w: 'stress', p: '/stres/', cn: 'n. 压力；重音 v. 着重', ex: 'A lot of illnesses are stress-related.', ez: '许多疾病与压力有关。' },
        { w: 'arrange', p: '/əˈreɪn(d)ʒ/', cn: 'v. 筹备；整理', ex: 'The list is arranged alphabetically.', ez: '名单按字母顺序排列。' },
        { w: 'launch', p: '/lɔːntʃ/', cn: 'v. 发射；投射', ex: 'The book launched his career as a novelist.', ez: '这本书开启了他的小说创作生涯。' },
        { w: 'imagination', p: '/ɪˌmædʒɪˈneɪʃ(ə)n/', cn: 'n. 想象；想象力', ex: 'It does not take much imagination to understand their grief.', ez: '不难想象他们是多么悲伤。' },
        { w: 'gross', p: '/grəʊs/', cn: 'adj. 总的；严重的', ex: 'The company was guilty of gross negligence.', ez: '该公司犯了重大的失职罪。' },
        { w: 'print', p: '/prɪnt/', cn: 'v. 印刷 n. 印刷；正片', ex: 'Over five million copies of the paper are printed every day.', ez: '这份报纸每日印量超过五百万。' },
        { w: 'throughout', p: '/θruːˈaʊt/', cn: 'prep. 遍及 adv. 到处', ex: 'The route is well sign-posted throughout.', ez: '这条路线全程设有路标。' },
        { w: 'describe', p: '/dɪˈskraɪb/', cn: 'v. 形容；描写', ex: 'The police asked her to describe the man.', ez: '警察叫她描述一下那名男子。' },
        { w: 'attend', p: '/əˈtend/', cn: 'v. 出席；照顾', ex: 'Please let us know if you are unable to attend.', ez: '如果不能出席，请通知我们。' },
        { w: 'practically', p: '/ˈpræktɪk(ə)lɪ/', cn: 'adv. 实际上；几乎', ex: 'The two designs were practically identical.', ez: '这两个设计几乎一模一样。' },
        { w: 'generation', p: '/dʒenəˈreɪʃ(ə)n/', cn: 'n. 一代；一代人', ex: 'In my generation the divorce rate is very high.', ez: '我们这一代人离婚率很高。' },
        { w: 'financial', p: '/faɪˈnænʃ(ə)l/', cn: 'adj. 财政的；金融的', ex: 'Organic farmers should be encouraged with financial incentives.', ez: '应对实行有机栽培的农民给予经济上的鼓励。' },
        { w: 'industry', p: '/ˈɪndəstrɪ/', cn: 'n. 工业；产业', ex: 'I work in the oil industry.', ez: '我在石油行业工作。' },
        { w: 'bond', p: '/bɒnd/', cn: 'n. 联结；联系', ex: 'My father put all his money into stock market bonds.', ez: '我父亲把他所有的钱都投在上市债券上。' },
        { w: 'brand', p: '/brænd/', cn: 'n. 商品；烙印 v. 铭刻', ex: 'Winston is a brand of cigarette.', ez: '云斯顿是一种香烟品牌。' },
        { w: 'painful', p: '/ˈpeɪnfʊl/', cn: 'adj. 使痛的；费力的', ex: 'Is your arm very painful?', ez: '你的手臂很疼吗？' },
        { w: 'religion', p: '/rɪˈlɪdʒ(ə)n/', cn: 'n. 宗教；宗教信仰', ex: 'The U.S. Constitution promises freedom of religion.', ez: '美国宪法保证宗教信仰自由。' },
        { w: 'influence', p: '/ˈɪnflʊəns/', cn: 'n. 影响；势力 v. 影响', ex: 'As a scientist, his influence was immense.', ez: '身为一名科学家，他的影响力极大。' },
        { w: 'fuel', p: '/fjʊəl/', cn: 'n. 燃料 v. 给…加燃料', ex: 'Coal is one of the cheapest fuels.', ez: '煤是最廉价的燃料之一。' },
        { w: 'exercise', p: '/ˈeksəsaɪz/', cn: 'n. 锻炼；训练 v. 练习', ex: 'Try to fit some regular exercise into your daily routine.', ez: '尽量在日常生活中安排一些经常性的锻炼。' },
        { w: 'attractive', p: '/əˈtræktɪv/', cn: 'adj. 有吸引力的', ex: 'Women seem to find him attractive.', ez: '女性似乎觉得他很有吸引力。' },
        { w: 'torture', p: '/ˈtɔːtʃə/', cn: 'n. 拷问；折磨 v. 拷打', ex: 'He died after five days of excruciating torture.', ez: '遭受了五天的严刑拷打之后，他死了。' },
        { w: 'plain', p: '/pleɪn/', cn: 'n. 平原 adj. 清楚的', ex: 'The grassy plain gave way to an extensive swamp.', ez: '青草覆盖的平原被广阔的沼泽地所取代。' },
        { w: 'confirm', p: '/kənˈfɜːm/', cn: 'v. 证实；肯定', ex: 'To confirm my diagnosis I need to do some tests.', ez: '为了证实我的诊断，我要做一些化验。' },
        { w: 'mile', p: '/maɪl/', cn: 'n. 英里', ex: 'He was driving at 70 miles per hour.', ez: '他正以每小时70英里的速度驾车行驶。' },
        { w: 'ending', p: '/ˈendɪŋ/', cn: 'n. 结尾；结局', ex: 'Verbal nouns have the ending -ing.', ez: '动名词以-ing结尾。' },
        { w: 'contest', p: '/ˈkɒntest/', cn: 'v. 争夺；争取', ex: 'His wife is contesting a seat on the council.', ez: '他妻子在角逐市政会的一个席位。' },
        { w: 'distant', p: '/ˈdɪst(ə)nt/', cn: 'adj. 在远处的；疏远的', ex: 'Her honeymoon seemed a distant memory.', ez: '她的蜜月似乎成了遥远的记忆。' }
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
        { w: 'confine', p: '/kənˈfaɪn/', cn: 'v. 限制；禁闭', ex: 'Confine your answer to one page.', ez: '把答案限制在一页以内。' },
        { w: 'industrial', p: '/ɪnˈdʌstriəl/', cn: 'adj. 工业的；产业的', ex: 'By 1900, Britain was a mainly industrial society.', ez: '到1900年英国已基本进入工业社会。' },
        { w: 'salute', p: '/səˈluːt/', cn: 'v. 敬礼；致意 n. 敬礼；致意', ex: 'The two soldiers saluted Lieutenant Cecil.', ez: '那两名士兵向塞西尔中尉行了礼。' },
        { w: 'fold', p: '/fəuld/', cn: 'v. 折叠；合拢 n. 褶；折叠的部分', ex: 'Fold the paper along the dotted line.', ez: '沿虚线将纸折起来。' },
        { w: 'melody', p: '/ˈmelədi/', cn: 'n. 旋律；曲调', ex: 'They played some lovely melodies.', ez: '他们演奏了一些动听的曲子。' },
        { w: 'shuttle', p: '/ˈʃʌtl/', cn: 'v. 穿梭往返 n. 班车；航天飞机', ex: 'He took the Washington - New York shuttle.', ez: '他乘坐华盛顿－纽约的往返班机。' },
        { w: 'initial', p: '/ɪˈnɪʃl/', cn: 'adj. 最初的；开始的 n. 首字母', ex: 'The initial response has been encouraging.', ez: '最初的反应情况很乐观。' },
        { w: 'hostile', p: '/ˈhɒstaɪl/', cn: 'adj. 敌方的；不友善的', ex: 'Southampton fans gave their former coach a hostile reception.', ez: '南安普敦队的球迷对球队的前任教练很不友善。' },
        { w: 'update', p: '/ˌʌpˈdeɪt/', cn: 'v. 更新；使现代化 n. 最新信息', ex: 'The files need updating.', ez: '这些档案需要更新。' },
        { w: 'rash', p: '/ræʃ/', cn: 'adj. 轻率的；鲁莽的 n. 疹；皮疹', ex: 'It was rather rash of you to lend them your car.', ez: '你把汽车借给他们实在有欠考虑。' },
        { w: 'flush', p: '/flʌʃ/', cn: 'v. 发红 adj. 齐平的；同高的', ex: 'Susan flushed deeply and looked away.', ez: '苏珊脸涨得通红，目光转向别处。' },
        { w: 'sensible', p: '/ˈsensəbl/', cn: 'adj. 明智的；合情理的', ex: 'Moving house seemed like the sensible thing to do.', ez: '搬家似乎是明智的做法。' },
        { w: 'prescription', p: '/prɪˈskrɪpʃn/', cn: 'n. 处方；药方', ex: 'We are trying to cut the price of prescription drugs.', ez: '我们正努力降低处方药的价格。' },
        { w: 'conscious', p: '/ˈkɒnʃəs/', cn: 'adj. 意识到的；自觉的', ex: 'The driver was still conscious when the ambulance arrived.', ez: '救护车赶到时，司机仍然神志清醒。' },
        { w: 'psychological', p: '/ˌsaɪkəˈlɒdʒɪkl/', cn: 'adj. 心理的', ex: 'Sleep disorders are a serious psychological problem.', ez: '睡眠障碍是严重的心理疾病。' },
        { w: 'plead', p: '/pliːd/', cn: 'v. 恳求；请求', ex: 'He appeared before the committee to plead his case.', ez: '他出现在委员会上为他的案子辩护。' },
        { w: 'objective', p: '/əbˈdʒektɪv/', cn: 'adj. 客观的；无偏见的 n. 目标；目的', ex: 'Scientists need to be objective when doing research.', ez: '科学家做研究时要客观。' },
        { w: 'briefcase', p: '/ˈbriːfkeɪs/', cn: 'n. 公文包；公事包', ex: 'No one told me about any briefcase.', ez: '没有人和我提过什么公文包。' },
        { w: 'encourage', p: '/ɪnˈkʌrɪdʒ/', cn: 'v. 鼓励；怂恿', ex: 'I want to thank everyone who has encouraged and supported me.', ez: '我要感谢每一位鼓励和支持过我的人。' },
        { w: 'relevant', p: '/ˈreləvənt/', cn: 'adj. 有关的；切题的', ex: 'Relevant documents were presented in court.', ez: '法庭上出示了相关的文件。' },
        { w: 'expense', p: '/ɪkˈspens/', cn: 'n. 花费；消费', ex: 'Conference rooms were equipped at great expense.', ez: '装备会议室花费巨大。' },
        { w: 'intact', p: '/ɪnˈtækt/', cn: 'adj. 完整无缺的；未经触动的', ex: 'Only the medieval tower had remained intact.', ez: '只有这座中世纪塔楼保存完好。' },
        { w: 'clip', p: '/klɪp/', cn: 'n. 夹子；回形针 v. 夹住；扣住', ex: 'The wire is held on with a metal clip.', ez: '电线用金属夹子固定。' },
        { w: 'resign', p: '/rɪˈzaɪn/', cn: 'v. 辞职；听任', ex: 'A hospital administrator has resigned over claims he lied to get the job.', ez: '一位医院主管因为有人声称他的职位是骗来的而辞职了。' },
        { w: 'legitimate', p: '/lɪˈdʒɪtɪmət/', cn: 'adj. 合情合理的；合理的 v. 使合法', ex: 'Most scientists believe it is legitimate to use animals in medical research.', ez: '大多数科学家认为用动物作医学研究是正当的。' },
        { w: 'plea', p: '/pliː/', cn: 'n. 恳求；请求', ex: 'Caldwell made a plea for donations.', ez: '考德威尔恳求捐款。' },
        { w: 'vacuum', p: '/ˈvækjuəm/', cn: 'n. 真空；吸尘器 v. 用吸尘器打扫', ex: 'I vacuumed the carpets today.', ez: '我今天用吸尘器清洁地毯了。' },
        { w: 'endure', p: '/ɪnˈdjuə/', cn: 'v. 忍受；容忍', ex: 'It seemed impossible that anyone could endure such pain.', ez: '似乎谁都不可能忍受这样的疼痛。' },
        { w: 'substance', p: '/ˈsʌbstəns/', cn: 'n. 物质；实质', ex: 'The leaves were covered with a strange sticky substance.', ez: '树叶上覆着一层黏糊糊的怪东西。' },
        { w: 'corrupt', p: '/kəˈrʌpt/', cn: 'adj. 堕落的；腐败的 v. 腐蚀；使堕落', ex: 'Corrupt judges have taken millions of dollars in bribes.', ez: '腐败的法官接受了几百万美元的贿赂。' },
        { w: 'possess', p: '/pəˈzes/', cn: 'v. 占用；拥有', ex: 'Different workers possess different skills.', ez: '不同的工人拥有不同技能。' },
        { w: 'addict', p: '/ˈædɪkt(forn.)/', cn: 'n. 有瘾的人；入迷的人 v. 使成瘾；使入迷', ex: "He's only 24 years old and a drug addict.", ez: '他只有24岁，可已经是一个瘾君子。' },
        { w: 'feature', p: '/ˈfiːtʃə/', cn: 'n. 特征；特色 v. 突出；由…主演', ex: 'Air bags are a standard feature in most new cars.', ez: '气囊是大多数新车的标准配置。' },
        { w: 'cope', p: '/kəup/', cn: 'v. 应付；处理', ex: 'Sometimes I find it hard to cope.', ez: '有时候我觉得很难应付。' },
        { w: 'automatic', p: '/ˌɔːtəˈmætɪk/', cn: 'adj. 自动的；必然发生的 n. 自动机械', ex: 'My camera is fully automatic.', ez: '我的照相机是全自动的。' },
        { w: 'salvation', p: '/sælˈveɪʃn/', cn: 'n. 拯救；解救', ex: "The church's message of salvation has changed the lives of many.", ez: '这个教会的灵魂得救的训诫已经改变了很多人的一生。' },
        { w: 'discount', p: '/ˈdɪskaʊnt/', cn: 'n. 折扣 v. 把…打折扣；不全信', ex: 'They are often available at a discount.', ez: '它们经常可以以折扣价买到。' },
        { w: 'grain', p: '/greɪn/', cn: 'n. 谷物；谷粒', ex: 'There were crumbs and grains of sugar on the table.', ez: '桌子上有面包屑和糖粒。' },
        { w: 'subtle', p: '/ˈsʌtl/', cn: 'adj. 微妙的；难以捉摸的', ex: 'The dish had a subtle hint of ginger.', ez: '这道菜微微带点姜的味道。' },
        { w: 'cord', p: '/kɔːd/', cn: 'n. 细绳；粗线', ex: 'The robe was held at the waist by a cord.', ez: '在袍子腰处束了根细绳。' },
        { w: 'origin', p: '/ˈɒrɪdʒɪn/', cn: 'n. 起源；起因', ex: 'The tradition has its origins in the Middle Ages.', ez: '这一传统源于中世纪。' },
        { w: 'shutter', p: '/ˈʃʌtə/', cn: 'n. 百叶窗；快门', ex: 'She opened the shutters and gazed out over village roofs.', ez: '她打开了百叶窗，朝村里的房顶望去。' },
        { w: 'ambitious', p: '/æmˈbɪʃəs/', cn: 'adj. 有抱负的；雄心勃勃的', ex: 'Alfred was intensely ambitious, obsessed with the idea of becoming rich.', ez: '艾尔弗雷德雄心勃勃，一心想着发财。' },
        { w: 'inevitable', p: '/ɪnˈevɪtəbl/', cn: 'adj. 不可避免的；必然的', ex: 'A further escalation of the crisis now seems inevitable.', ez: '危机的进一步升级现在看来已不可避免。' },
        { w: 'tick', p: '/tɪk/', cn: 'v. 发出滴答声 n. 记号；勾号', ex: 'The old clock ticked noisily.', ez: '那只古老的钟大声地嘀嗒着。' },
        { w: 'rival', p: '/ˈraɪvl/', cn: 'adj. 竞争的；对抗的 n. 竞争对手；敌手', ex: 'He is, in effect, my rival.', ez: '实际上他是我的竞争对手。' },
        { w: 'purchase', p: '/ˈpɜːtʃəs/', cn: 'v. 买；购买 n. 购买；购买的物品', ex: 'You can purchase insurance online.', ez: '你可以在网上买保险。' },
        { w: 'frequency', p: '/ˈfriːkwənsi/', cn: 'n. 屡次；次数', ex: 'The relative frequency of fraternal twins has halved since 1950.', ez: '自1950年以来，异卵双胞胎的相对出生率下降了一半。' },
        { w: 'resume', p: '/rɪˈzjuːm/', cn: 'v. 重新开始；继续 n. 摘要；概要', ex: 'She hopes to resume work after the baby is born.', ez: '她想生完孩子后继续工作。' },
        { w: 'distract', p: '/dɪˈstrækt/', cn: 'v. 转移；使分心', ex: 'Try not to distract the other students.', ez: '尽量不要让其他学生分心。' },
        { w: 'sour', p: '/ˈsauə/', cn: 'adj. 酸的；馊的 v. 变酸；变馊', ex: 'Rachel sampled the wine. It was sour.', ez: '雷切尔尝了尝葡萄酒，是酸的。' },
        { w: 'peak', p: '/piːk/', cn: 'v. 达到高峰；达到最大值', ex: 'Sales peaked in August, then fell sharply.', ez: '销售额8月份达到最高点，然后急速下降。' },
        { w: 'concentration', p: '/ˌkɒnsnˈtreɪʃn/', cn: 'n. 集中；专注', ex: 'Lack of concentration was a real problem.', ez: '注意力不集中是个大问题。' },
        { w: 'presume', p: '/prɪˈzjuːm/', cn: 'v. 擅自行事；推测', ex: "I presume you're here on business.", ez: '我想你是来这儿出差的吧。' },
        { w: 'radical', p: '/ˈrædɪkl/', cn: 'adj. 根本的；基本的 n. 激进分子', ex: 'There are radical differences between the two organizations.', ez: '这两个组织有着根本差异。' },
        { w: 'breed', p: '/briːd/', cn: 'v. 繁殖；养育 n. 品种', ex: 'Eagles breed during the cooler months of the year.', ez: '鹰在一年中较凉爽的季节交配繁殖。' },
        { w: 'adore', p: '/əˈdɔː/', cn: 'v. 崇拜；敬慕', ex: 'Betty adores her grandchildren.', ez: '贝蒂非常宠爱孙辈。' },
        { w: 'haul', p: '/hɔːl/', cn: 'v. 拖；拉 n. 拖；拉', ex: 'I hauled the door shut behind me.', ez: '我用力拽上了门。' },
        { w: 'essence', p: '/ˈesns/', cn: 'n. 本质；实质', ex: 'In essence his message was very simple.', ez: '实质上他想表达的意思很简单。' },
        { w: 'wardrobe', p: '/ˈwɔːdrəub/', cn: 'n. 衣柜；全部衣物', ex: 'Can you hang these in the wardrobe, please?', ez: '请你把这些衣服挂到衣橱里去好吗？' },
        { w: 'urge', p: '/ɜːdʒ/', cn: 'v. 鼓励；推进 n. 冲动；强烈的欲望', ex: 'The charity urged quick action.', ez: '慈善机构敦促迅速采取行动。' },
        { w: 'additional', p: '/əˈdɪʃənl/', cn: 'adj. 附加的；追加的', ex: 'Additional information can be obtained from the centre.', ez: '可以从中心获取更多信息。' },
        { w: 'reckless', p: '/ˈrekləs/', cn: 'adj. 鲁莽的；不考虑后果的', ex: 'He was accused of causing death by reckless driving.', ez: '他被控因鲁莽驾驶致人死亡。' },
        { w: 'casual', p: '/ˈkæʒuəl/', cn: 'adj. 偶然的；非正式的', ex: 'Jean felt more comfortable in casual clothes.', ez: '琼穿上便服感到更舒服。' },
        { w: 'fitting', p: '/ˈfɪtɪŋ/', cn: 'adj. 适合的；恰当的 n. 设备；家具', ex: 'I thought the memorial was a fitting tribute to the President.', ez: '我认为这座纪念碑恰如其分地表达了对总统的敬意。' },
        { w: 'tuck', p: '/tʌk/', cn: 'v. 把边塞到下面；把…夹入 n. 褶；裥', ex: 'He tried to tuck his flapping shirt inside his trousers.', ez: '他试图把飘动的衬衫塞进他的裤子里。' },
        { w: 'cardinal', p: '/ˈkɑːdɪnl/', cn: 'adj. 最重要的；基本的', ex: 'Having clean hands is one of the cardinal rules when preparing food.', ez: '双手洁净是准备食物时的一项最基本要求。' },
        { w: 'thrill', p: '/θrɪl/', cn: 'v. 非常兴奋；非常激动 n. 兴奋；激动', ex: 'His music continues to thrill audiences.', ez: '他的音乐依然能扣人心弦。' },
        { w: 'lounge', p: '/laundʒ/', cn: 'v. 倚；躺 n. 休息厅；休息室', ex: 'Nathan was lounging on the grass bank outside the cottage.', ez: '内森正懒洋洋地躺在小屋外的草堤上。' },
        { w: 'dimension', p: '/dɪˈmenʃn/', cn: 'n. 尺寸；尺度', ex: 'You can have a spiritual dimension to your life without being religious.', ez: '即使你不信宗教，也可以在生命中拥有精神层面的内容。' },
        { w: 'mortgage', p: '/ˈmɔːgɪdʒ/', cn: 'n. 抵押；抵押借款 v. 抵押', ex: 'Mortgage rates are set to rise again in the spring.', ez: '抵押贷款利率到春季肯定还要上涨。' },
        { w: 'shipment', p: '/ˈʃɪpmənt/', cn: 'n. 装运；装船', ex: 'The goods are ready for shipment.', ez: '货物已经准备好装运。' },
        { w: 'efficient', p: '/ɪˈfɪʃnt/', cn: 'adj. 效率高的；有能力的', ex: 'Lighting is now more energy efficient.', ez: '如今的照明设备更加节能。' },
        { w: 'gracious', p: '/ˈgreɪʃəs/', cn: 'adj. 亲切的；和蔼的 int. 天哪!', ex: 'Sibyl was the most gracious, helpful, and generous person to work with.', ez: '西比尔非常和蔼，乐于助人，而且为人慷慨，和她共事最愉快。' },
        { w: 'resolve', p: '/rɪˈzɒlv/', cn: 'v. 决定；解决 n. 决心', ex: 'Barnet was desperate for money to resolve his financial problems.', ez: '巴尼特急需钱来解决他的经济问题。' },
        { w: 'mechanical', p: '/məˈkænɪkl/', cn: 'adj. 机械的；机械制造的', ex: 'The flight has been cancelled due to mechanical failure.', ez: '因机械故障航班被取消了。' },
        { w: 'chorus', p: '/ˈkɔːrəs/', cn: 'n. 合唱队；合唱 v. 齐声说；随声附和', ex: 'Everyone joined in the chorus.', ez: '唱到副歌时，每个人都跟着齐唱起来。' },
        { w: 'burial', p: '/ˈberiəl/', cn: 'n. 葬；掩埋', ex: 'The priest prepared the body for burial.', ez: '牧师为尸体做好了下葬的准备。' },
        { w: 'breakdown', p: '/ˈbreɪkdaun/', cn: 'n. 垮台；破裂', ex: 'Always carry a phone with you in case you have a breakdown on the motorway.', ez: '一定要随身带电话，以防汽车在高速公路上抛锚。' },
        { w: 'gown', p: '/gaun/', cn: 'n. 女礼服；女裙服', ex: 'The new ball gown was a great success.', ez: '那件新款长礼服非常成功。' },
        { w: 'dispatch', p: '/dɪˈspætʃ/', cn: 'v. 派遣；调遣 n. 急件；快信', ex: 'Goods are normally dispatched within 24 hours.', ez: '货物一般在24小时内派送。' },
        { w: 'identification', p: '/aɪˌdentɪfɪˈkeɪʃn/', cn: 'n. 身份证明；鉴定', ex: 'Do you have any identification?', ez: '你有什么身份证明文件吗？' },
        { w: 'transplant', p: '/trænsˈplɑːnt/', cn: 'v. 移栽；移种 n. 移植', ex: 'The operation to transplant a kidney is now fairly routine.', ez: '移植肾脏的手术如今相当常见。' },
        { w: 'blunt', p: '/blʌnt/', cn: 'adj. 钝的；率直的 v. 使迟钝；使减弱', ex: 'Sharpen all your blunt knives.', ez: '把你所有的钝刀子都磨一磨。' },
        { w: 'consult', p: '/kənˈsʌlt/', cn: 'v. 请教；查阅', ex: 'If symptoms persist, consult a doctor without delay.', ez: '如果症状持续的话，马上咨询医生。' },
        { w: 'barrier', p: '/ˈbæriə/', cn: 'n. 栅栏；检票口', ex: 'He advocated the removal of trade barriers.', ez: '他提倡消除贸易壁垒。' },
        { w: 'lease', p: '/liːs/', cn: 'n. 租约；租契 v. 出租；租得', ex: 'The landlord refused to renew his lease.', ez: '房东拒绝和他续签租约。' },
        { w: 'lure', p: '/luə/', cn: 'v. 吸引；引诱 n. 吸引力；诱惑物', ex: "He lured her to his home and shot her with his father's gun.", ez: '他把她诱骗到家里，然后用父亲的枪把她打死。' },
        { w: 'notion', p: '/ˈnəuʃn/', cn: 'n. 概念；观念', ex: 'She had no notion what he meant.', ez: '她根本不明白他是什么意思。' },
        { w: 'tease', p: '/tiːz/', cn: 'v. 戏弄；取笑', ex: 'He used to tease her mercilessly.', ez: '他过去总是无情地取笑她。' },
        { w: 'stack', p: '/stæk/', cn: 'n. 堆；垛 v. 堆积；堆放于', ex: 'Mrs. Cathiard was stacking the clean bottles in crates.', ez: '卡提亚夫人当时正在把干净的瓶子堆放到板条箱里。' },
        { w: 'venture', p: '/ˈventʃə/', cn: 'v. 冒险；大胆行事 n. 风险投资；风险项目', ex: 'When darkness fell, he would venture out.', ez: '天黑以后，他就会壮着胆子出去。' },
        { w: 'occupation', p: '/ˌɒkjuˈpeɪʃn/', cn: 'n. 占领；占据', ex: 'Please state your name, address and occupation.', ez: '请写明你的姓名、地址和职业。' },
        { w: 'exhibit', p: '/ɪgˈzɪbɪt/', cn: 'v. 显示；陈列 n. 展览品', ex: 'Her paintings have been exhibited all over the world.', ez: '她的绘画作品在世界各地展出。' },
        { w: 'hurricane', p: '/ˈhʌrɪkən/', cn: 'n. 飓风', ex: 'I still remember a hurricane that hit us thirty years ago.', ez: '我还记得三十年前袭击我们的一次飓风。' },
        { w: 'destined', p: '/ˈdestɪnd/', cn: 'adj. 命中注定的；预定的', ex: 'The flight was destined for Cairo.', ez: '本次航班飞往开罗。' },
        { w: 'predict', p: '/prɪˈdɪkt/', cn: 'v. 预言；预告', ex: 'Sales were five percent lower than predicted.', ez: '销售额比预期低5%。' },
        { w: 'confront', p: '/kənˈfrʌnt/', cn: 'v. 迎面遇到；遭遇', ex: 'The problems confronting the new government were enormous.', ez: '新政府面临的难题是巨大的。' },
        { w: 'acknowledge', p: '/əkˈnɒlɪdʒ/', cn: 'v. 承认；承认…的权威', ex: 'The family acknowledge the need for change.', ez: '全家人都承认需要改变一下。' },
        { w: 'glow', p: '/gləu/', cn: 'v. 发光；燃烧 n. 白热光；脸红', ex: 'The red tip of his cigarette was glowing in the dark.', ez: '他那红红的烟头在黑暗中幽幽发光。' },
        { w: 'proposition', p: '/ˌprɒpəˈzɪʃn/', cn: 'n. 论点；主张', ex: 'The theory is founded on two basic propositions.', ez: '这个理论是建立在两个基本观点之上的。' },
        { w: 'justify', p: '/ˈdʒʌstɪfaɪ/', cn: 'v. 证明…是正当的', ex: 'Nothing justifies murdering another human being.', ez: '什么都不能成为谋杀他人的正当理由。' },
        { w: 'ammunition', p: '/ˌæmjuˈnɪʃn/', cn: 'n. 弹药；军火', ex: 'He had only seven rounds of ammunition for the revolver.', ez: '他只有7发左轮手枪的弹药。' },
        { w: 'notify', p: '/ˈnəutɪfaɪ/', cn: 'v. 通知；告知', ex: 'The skipper notified the coastguard of the tragedy.', ez: '船长通知了海岸警卫队这一灾难。' },
        { w: 'treaty', p: '/ˈtriːti/', cn: 'n. 条约；协议', ex: 'Both sides have agreed to sign the treaty.', ez: '双方都同意签署该条约。' },
        { w: 'hike', p: '/haɪk/', cn: 'v. 徒步旅行 n. 徒步旅行；增加', ex: 'He wants to hike round the world.', ez: '他打算徒步旅行环游世界一周。' },
        { w: 'detect', p: '/dɪˈtekt/', cn: 'v. 察觉；发觉', ex: 'Many forms of cancer can be cured if detected early.', ez: '如果发现得早，许多种癌症都可以治愈。' },
        { w: 'virtue', p: '/ˈvɜːtjuː/', cn: 'n. 善；美德', ex: 'Women have often been used as symbols of virtue.', ez: '女性常被用作美德的象征。' },
        { w: 'peel', p: '/piːl/', cn: 'v. 剥落；脱皮 n. 皮；外衣', ex: 'Peel and dice the potatoes.', ez: '把马铃薯去皮并切成丁。' },
        { w: 'workshop', p: '/ˈwɜːkʃɒp/', cn: 'n. 车间；工场', ex: 'Trumpeter Marcus Belgrave ran a jazz workshop for young artists.', ez: '鼓手马库斯马贝尔格瑞夫为年轻艺术家们举办了一场爵士乐研讨会。' },
        { w: 'expand', p: '/ɪkˈspænd/', cn: 'v. 扩大；膨胀', ex: 'Water expands as it freezes.', ez: '水结冰时会膨胀。' },
        { w: 'fury', p: '/ˈfjuəri/', cn: 'n. 狂怒；暴怒', ex: 'Jo stepped forward, her eyes blazing with fury.', ez: '乔满眼冒火地走上前来。' },
        { w: 'peculiar', p: '/pɪˈkjuːlɪə/', cn: 'adj. 奇怪的；古怪的', ex: 'There was a peculiar smell in the kitchen.', ez: '厨房里有一股怪味。' },
        { w: 'fuse', p: '/fjuːz/', cn: 'v. 熔合；合并 n. 保险丝；熔丝', ex: 'Their music fuses elements as diverse as Cajun, bebop and Cuban waltzes.', ez: '他们的音乐融合了卡津音乐、博普爵士乐和古巴华尔兹等不同元素。' },
        { w: 'recognition', p: '/ˌrekəgˈnɪʃn/', cn: 'n. 认出；识别', ex: 'He has achieved recognition and respect as a scientist.', ez: '作为科学家，他得到人们的赞赏和尊敬。' },
        { w: 'ferry', p: '/ˈferi/', cn: 'n. 渡船 v. 渡运', ex: 'They had recrossed the River Gambia by ferry.', ez: '他们乘船又一次渡过了冈比亚河。' },
        { w: 'sensation', p: '/senˈseɪʃn/', cn: 'n. 感觉能力；感觉', ex: 'Jerry realized that he had no sensation in his legs.', ez: '杰里意识到自己双腿都没有了知觉。' },
        { w: 'caution', p: '/ˈkɔːʃn/', cn: 'n. 小心；谨慎 v. 警告；劝…小心', ex: 'The physician must exercise caution when prescribing antidepressants.', ez: '医师在开抗抑郁药处方时必须谨慎。' },
        { w: 'obligation', p: '/ˌɒblɪˈgeɪʃn/', cn: 'n. 义务；责任', ex: 'You are under no obligation to buy any more books.', ez: '你不必非要买更多的书。' },
        { w: 'clearance', p: '/ˈklɪərəns/', cn: 'n. 净空；余隙', ex: 'Morris did not have a security clearance.', ez: '莫里斯没有安全审查许可。' },
        { w: 'reflect', p: '/rɪˈflekt/', cn: 'v. 反映；显示', ex: 'The drop in consumer spending reflects concern about the economy.', ez: '消费支出的下降反映出人们对经济的担忧。' }
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
        { w: 'entrepreneur', p: '/ˌɒntrəprəˈnɜː(r)/', cn: 'n. 创业者；企业家', ex: 'Young entrepreneurs need support.', ez: '年轻创业者需要支持。' },
        { w: 'cube', p: '/kjuːb/', cn: 'n. 立方(体)', ex: 'Cut the meat into small cubes.', ez: '把肉切成丁。' },
        { w: 'alternate', p: '/ˈɔːltəneɪt/', cn: 'adj. 交替的；轮流的 v. 轮流交替；交替', ex: 'Arrange the leeks and noodles in alternate layers.', ez: '一层韭葱、一层面条地交替放置。' },
        { w: 'trench', p: '/tren(t)ʃ/', cn: 'n. 地沟', ex: 'Workers dug a trench for gas lines.', ez: '工人们挖了一条沟来铺设煤气管道。' },
        { w: 'remedy', p: '/ˈremɪdɪ/', cn: 'n. 治疗；补救', ex: 'The problems in our schools do not have a simple remedy.', ez: '我们学校的问题没有简单的解决办法。' },
        { w: 'vein', p: '/veɪn/', cn: 'n. 静脉；叶脉', ex: 'She felt the blood racing through her veins as they kissed.', ez: '他们接吻时她觉得热血沸腾。' },
        { w: 'steep', p: '/stiːp/', cn: 'adj. 陡峭的', ex: 'The road became rocky and steep.', ez: '路变得崎岖陡峭起来。' },
        { w: 'dispose', p: '/dɪˈspəʊz/', cn: 'v. 处理；处置', ex: 'Chinese vases are disposed around the gallery.', ez: '中国花瓶摆放在展馆四周。' },
        { w: 'hound', p: '/haʊnd/', cn: 'n. 猎狗；卑鄙的人 v. 用猎狗追；追逐', ex: 'A troubled hound was baying the moon.', ez: '一条受惊不安的猎狗正在对月狂吠。' },
        { w: 'convey', p: '/kənˈveɪ/', cn: 'v. 传达；运送', ex: 'Ads convey the message that thin is beautiful.', ez: '广告传递的信息是: 瘦就是美。' },
        { w: 'prototype', p: '/ˈprəʊtətaɪp/', cn: 'n. 原型', ex: 'But how do you come up with the architecture for this evolutionary prototype?', ez: '但是你将如何为这个进化的原型提出系统的架构呢？' },
        { w: 'mourn', p: '/mɔːn/', cn: 'v. 哀悼', ex: 'Hundreds of people gathered to mourn the slain president.', ez: '成百上千人聚集在一起悼念遇刺的总统。' },
        { w: 'tornado', p: '/tɔːˈneɪdəʊ/', cn: 'n. 飓风；龙卷风', ex: 'The tornado rubbished the whole village.', ez: '龙卷风毁掉了整个村庄。' },
        { w: 'annoy', p: '/əˈnɒɪ/', cn: 'v. 使烦恼；使生气', ex: 'She annoyed him with her stupid questions.', ez: '她那些愚蠢的问题令他很恼火。' },
        { w: 'harness', p: '/ˈhɑːnɪs/', cn: 'v. 上挽具；治理 n. 挽具；降落伞背带', ex: 'We can harness the power of the wind to generate electricity.', ez: '我们可以利用风力发电。' },
        { w: 'orderly', p: '/ˈɔːd(ə)lɪ/', cn: 'adj. 整齐的；有秩序的', ex: 'She needs to organize her ideas in a more orderly way.', ez: '她需要把自己的想法组织得更有条理些。' },
        { w: 'certainty', p: '/ˈsɜːt(ə)ntɪ/', cn: 'n. 必然的事；必然', ex: 'The result is impossible to predict with any degree of certainty.', ez: '这一结果完全无法确切预测。' },
        { w: 'utmost', p: '/ˈʌtməʊst/', cn: 'adj. 最远的；最大的', ex: 'Security matters are treated with the utmost seriousness.', ez: '安全问题受到极为严肃的对待。' },
        { w: 'dwell', p: '/dwel/', cn: 'v. 居住；详述', ex: 'They dwelt in the forest.', ez: '他们住在森林里。' },
        { w: 'transaction', p: '/trænˈzækʃ(ə)n/', cn: 'n. 办理；处理', ex: 'The bank charges a fixed rate for each transaction.', ez: '银行对每一笔业务收取固定费用。' },
        { w: 'excess', p: '/ɪkˈses/', cn: 'n. 超越；超过 adj. 额外的；附加的', ex: 'The car reached speeds in excess of 100 miles per hour.', ez: '这辆汽车的时速超过了100英里。' },
        { w: 'install', p: '/ɪnˈstɔ:l/', cn: 'v. 任命；安装', ex: 'Security cameras have been installed in the city centre.', ez: '在市中心已安装了一些监控摄像机。' },
        { w: 'abnormal', p: '/æbˈnɔːml/', cn: 'adj. 反常的；变态的', ex: 'My parents thought it was abnormal for a boy to be interested in ballet.', ez: '我父母认为一个男孩子对芭蕾舞感兴趣并不正常。' },
        { w: 'generate', p: '/ˈdʒenəreɪt/', cn: 'v. 使产生；使发生', ex: 'The program would generate a lot of new jobs.', ez: '这个项目将创造许多新的就业岗位。' },
        { w: 'vicinity', p: '/vɪˈsɪnɪtɪ/', cn: 'n. 邻近；附近', ex: 'There used to be a mill in the vicinity.', ez: '附近曾有一座磨坊。' },
        { w: 'predictable', p: '/prɪˈdɪktəb(ə)l/', cn: 'adj. 可预言的', ex: 'The snow had a predictable effect on traffic.', ez: '这场雪对交通造成的影响可以预见。' },
        { w: 'haste', p: '/heɪst/', cn: 'n. 急速；仓促', ex: 'I soon regretted my haste.', ez: '我很快就对自己的仓促感到后悔。' },
        { w: 'commotion', p: '/kəˈməʊʃ(ə)n/', cn: 'n. 混乱；动乱', ex: 'They heard a commotion downstairs.', ez: '他们听见楼下一阵骚动。' },
        { w: 'extinct', p: '/ɪkˈstɪŋkt/', cn: 'adj. 消灭了的；熄灭了的', ex: 'Pandas could become extinct in the wild.', ez: '熊猫在野生环境中可能会绝种。' },
        { w: 'recite', p: '/rɪˈsaɪt/', cn: 'v. 背诵；列举', ex: 'She recited a poem that she had learnt at school.', ez: '她背诵了一首学校里学的诗。' },
        { w: 'vacant', p: '/ˈveɪk(ə)nt/', cn: 'adj. 空的；未被占用的', ex: 'Only a few apartments were still vacant.', ez: '只有几套公寓仍然空着。' },
        { w: 'hasty', p: '/ˈheɪstɪ/', cn: 'adj. 急速的；匆促的', ex: 'He soon regretted his hasty decision.', ez: '他很快就对自己仓促作出的决定感到后悔了。' },
        { w: 'occupy', p: '/ˈɒkjʊpaɪ/', cn: 'v. 居住；占', ex: 'He occupies the house without paying any rent.', ez: '他住在这幢房子里，没有付一分钱房租。' },
        { w: 'clarity', p: '/ˈklærɪtɪ/', cn: 'n. 清澈；明晰', ex: 'Letters may be edited for length and clarity.', ez: '信件可能要加以修改以求篇幅合适，意思明了。' },
        { w: 'prejudice', p: '/ˈpredʒʊdɪs/', cn: 'n. 偏见；成见', ex: 'Women still face prejudice in the workplace.', ez: '女性在职场中仍然面临歧视。' },
        { w: 'threshold', p: '/ˈθreʃəʊld/', cn: 'n. 门槛；开始', ex: 'She opened the door and stepped across the threshold.', ez: '她打开门，跨过门槛。' },
        { w: 'soak', p: '/səʊk/', cn: 'v. 浸；使浸透', ex: 'Soak the clothes in cold water.', ez: '把衣服浸泡在冷水里。' },
        { w: 'clutch', p: '/klʌtʃ/', cn: 'v. 抓住；攫住 n. 抓；控制', ex: 'Tom fell to the ground clutching his stomach.', ez: '汤姆捂着肚子倒在地上。' },
        { w: 'gloomy', p: '/ˈgluːmɪ/', cn: 'adj. 黑暗的；郁闷的', ex: 'Anne dismissed these gloomy thoughts from her mind.', ez: '安妮抛开了心里这些沮丧的念头。' },
        { w: 'sustain', p: '/səˈsteɪn/', cn: 'v. 支撑；支持', ex: 'He was incapable of sustaining close relationships with women.', ez: '他无法和女人维持亲密关系。' },
        { w: 'resemblance', p: '/rɪˈzembl(ə)ns/', cn: 'n. 相似；类似', ex: 'There was a remarkable resemblance between him and Pete.', ez: '他和皮特有一个惊人的相似之处。' },
        { w: 'ingredient', p: '/ɪnˈgriːdɪənt/', cn: 'n. 配料', ex: 'Combine all the ingredients in a large bowl.', ez: '把所有食材都放在一个大碗里。' },
        { w: 'considerate', p: '/kənˈsɪd(ə)rət/', cn: 'adj. 考虑周到的；体谅别人的', ex: "I think he's the most charming, most considerate man I've ever known.", ez: '我觉得他是我所认识的最有魅力、最体贴的男士。' },
        { w: 'allegiance', p: '/əˈliːdʒ(ə)ns/', cn: 'n. 忠诚', ex: 'The people here have strong political allegiances.', ez: '这里的民众政治忠诚度很高。' },
        { w: 'slope', p: '/sləʊp/', cn: 'n. 斜线；斜度', ex: 'She looked back up the grassy slope.', ez: '她回头望了一眼那绿草如茵的坡地。' },
        { w: 'impose', p: '/ɪmˈpəʊz/', cn: 'v. 把…强加于；征(税)', ex: 'Parents should beware of imposing their own tastes on their children.', ez: '父母应该提防把自己的兴趣强加给孩子。' },
        { w: 'undoubtedly', p: '/ʌnˈdaʊtɪdlɪ/', cn: 'adv. 无疑地；必是地', ex: 'This is undoubtedly important.', ez: '这无疑是重要的。' },
        { w: 'crisp', p: '/krɪsp/', cn: 'adj. 脆的；干脆的 n. 油炸马铃薯片', ex: 'She kicked at the crisp leaves at her feet.', ez: '她踢着脚边松脆的树叶。' },
        { w: 'flexible', p: '/ˈfleksɪb(ə)l/', cn: 'adj. 易弯曲的；柔软的', ex: 'We can be flexible about your starting date.', ez: '你具体从哪天开始，我们可以灵活一点。' },
        { w: 'metallic', p: '/mɪˈtælɪk/', cn: 'adj. 金属的', ex: 'The key turned in the lock with a loud metallic click.', ez: '钥匙在锁里转动发出金属撞击的咔嗒声。' },
        { w: 'initiate', p: '/ɪˈnɪʃɪeɪt/', cn: 'v. 创始；着手', ex: 'They have decided to initiate legal proceedings against the newspaper.', ez: '他们决定向该报提起法律诉讼。' },
        { w: 'indulge', p: '/ɪnˈdʌldʒ/', cn: 'v. 放纵；沉迷于', ex: 'His mother spoiled him, indulging his every whim.', ez: '他母亲对他纵容娇惯，百依百顺。' },
        { w: 'solemn', p: '/ˈsɒləm/', cn: 'adj. 庄严的；严肃的', ex: 'Their faces suddenly grew solemn.', ez: '他们的脸突然变得严肃起来。' },
        { w: 'override', p: '/əʊvəˈraɪd/', cn: 'v. 不理(某人的愿望要求)；不顾', ex: 'The EU commission exercised its power to override British policy.', ez: '欧盟委员会行使其权力来否决英国的政策。' },
        { w: 'meadow', p: '/ˈmedəʊ/', cn: 'n. 草地', ex: 'There are many lambs capering in the meadow.', ez: '很多小羊在草地上蹦蹦跳跳。' },
        { w: 'refugee', p: '/refjʊˈdʒiː/', cn: 'n. 避难者；难民', ex: 'Refugees were streaming across the border.', ez: '难民正涌过边境。' },
        { w: 'dilemma', p: '/dɪˈlemə/', cn: 'n. 进退两难的境地；困境', ex: 'This placed Robert Kennedy in a dilemma.', ez: '这让罗伯特·肯尼迪陷入了两难的境地。' },
        { w: 'prominent', p: '/ˈprɒmɪnənt/', cn: 'adj. 突出的；显要的', ex: 'The World Cup will have a prominent place on the agenda.', ez: '世界杯赛将占据议程表的重要位置。' },
        { w: 'imminent', p: '/ˈɪmɪnənt/', cn: 'adj. 迫近的；紧迫的', ex: 'A new trade agreement is imminent.', ez: '一项新的贸易协定即将签署。' },
        { w: 'prosecute', p: '/ˈprɒsɪkjuːt/', cn: 'v. 告发；起诉', ex: 'Shoplifters will be prosecuted.', ez: '在商店行窃者将被起诉。' },
        { w: 'interrogate', p: '/ɪnˈterəgeɪt/', cn: 'v. 询问；审问', ex: 'The police interrogated the suspect for several hours.', ez: '警察盘问了这名嫌疑犯好几个小时。' },
        { w: 'precaution', p: '/prɪˈkɔːʃ(ə)n/', cn: 'n. 预防', ex: 'Fire precautions were neglected.', ez: '防火措施被忽视了。' },
        { w: 'conceal', p: '/kənˈsiːl/', cn: 'v. 隐藏；隐蔽', ex: 'The path was concealed by long grass.', ez: '小路隐藏在长长的草里。' },
        { w: 'sentiment', p: '/ˈsentɪm(ə)nt/', cn: 'n. 思想感情；情操', ex: 'Public sentiment rapidly turned anti-American.', ez: '公众的情绪迅速转向反美。' },
        { w: 'deliberate', p: '/dɪˈlɪb(ə)rət/', cn: 'adj. 故意的；从容的 v. 仔细考虑', ex: 'The attack on him was quite deliberate.', ez: '对他的袭击完全是有预谋的。' },
        { w: 'isolate', p: '/ˈaɪsəleɪt/', cn: 'v. 隔离；孤立', ex: 'The town was isolated by the floods.', ez: '洪水使该镇与外界隔绝。' },
        { w: 'marvel', p: '/ˈmɑːv(ə)l/', cn: 'n. 令人惊奇的事；创造奇迹', ex: 'The whale, like the dolphin, has become a symbol of the marvels of creation.', ez: '鲸，和海豚一样，已经成为造物杰作的象征。' },
        { w: 'penetrate', p: '/ˈpenɪtreɪt/', cn: 'v. 穿过；透过', ex: 'Sunlight barely penetrated the dirty windows.', ez: '阳光几乎照不进那些肮脏的窗户。' },
        { w: 'intervene', p: '/ɪntəˈviːn/', cn: 'v. 插入；介入', ex: 'The army will have to intervene to prevent further fighting.', ez: '军队将不得不干预以阻止进一步的战斗。' },
        { w: 'inferior', p: '/ɪnˈfɪərɪə/', cn: 'n. 地位(能力)低的人 adj. 劣质的；差的', ex: "It was a gentleman's duty always to be civil, even to his inferiors.", ez: '一个绅士的责任是一直保持彬彬有礼，即使是对比自己地位低的人。' },
        { w: 'uneasy', p: '/ʌnˈiːzɪ/', cn: 'adj. 不自在的', ex: 'She eventually fell into an uneasy sleep.', ez: '她终于睡着了，但睡得并不踏实。' },
        { w: 'counterfeit', p: '/ˈkaʊntəfɪt/', cn: 'adj. 伪造的 n. 伪造', ex: 'He admitted possessing and delivering counterfeit currency.', ez: '他承认持有和运送了假币。' },
        { w: 'formidable', p: '/ˈfɔːmɪdəb(ə)l/', cn: 'adj. 可怕的；难以对付的', ex: 'The building is grey, formidable, not at all picturesque.', ez: '那幢建筑呈灰色，气势凛然，与漂亮沾不上边。' },
        { w: 'liaison', p: '/lɪˈeɪz(ə)n/', cn: 'n. 联络', ex: 'Liaison between police forces and the art world is vital to combat art crime.', ez: '警方和艺术界之间的联络对于打击艺术犯罪是至关重要的。' },
        { w: 'surge', p: '/sɜːdʒ/', cn: 'v. 波动；汹涌', ex: 'Adrenalin surged through her veins.', ez: '她血脉偾张。' },
        { w: 'insert', p: '/ɪnˈsɜːt/', cn: 'v. 插入 n. 插入物；插页', ex: 'He took a small key from his pocket and slowly inserted it into the lock.', ez: '他从衣袋里掏出一把小钥匙，然后缓缓地将其插入锁孔里。' },
        { w: 'ingenious', p: '/ɪnˈdʒiːnɪəs/', cn: 'adj. 机灵的；制作精巧的', ex: 'Many fish have ingenious ways of protecting their eggs from predators.', ez: '很多鱼都有绝妙的方法来保护它们产的卵不被捕食者吃掉。' },
        { w: 'heave', p: '/hiːv/', cn: 'v. 用力举起；说出 n. 举；拉', ex: 'The sea heaved up and down beneath the boat.', ez: '船的下面大海波涛汹涌。' },
        { w: 'incidentally', p: '/ɪnsɪˈdent(ə)lɪ/', cn: 'adv. 偶然地；顺便地', ex: 'Quite incidentally, I got some useful information at the party.', ez: '我在聚会上无意中得到了一些有用信息。' },
        { w: 'wrestle', p: '/ˈres(ə)l/', cn: 'v. 摔跤；角斗', ex: 'Police officers wrestled him to the ground.', ez: '警察把他扑倒在地。' },
        { w: 'mandatory', p: '/ˈmændət(ə)rɪ/', cn: 'adj. 命令的；强制性的', ex: 'Murder carries a mandatory life sentence.', ez: '谋杀罪依照法律要判无期徒刑。' },
        { w: 'parasite', p: '/ˈpærəsaɪt/', cn: 'n. 寄生虫；寄生植物', ex: 'Kangaroos harbour a vast range of parasites.', ez: '袋鼠身上有各种各样的寄生虫。' },
        { w: 'ownership', p: '/ˈəʊnəʃɪp/', cn: 'n. 所有权', ex: 'The price of home ownership is increasing.', ez: '房价在不断上涨。' },
        { w: 'sphere', p: '/sfɪə/', cn: 'n. 球；球面', ex: 'Because the earth spins, it is not a perfect sphere.', ez: '因为地球旋转，所以它不是个完完全全的球体。' },
        { w: 'outlaw', p: '/ˈaʊtlɔː/', cn: 'n. 被剥夺公民权者 v. 禁止', ex: 'The bill would have outlawed several types of guns.', ez: '这项法案将全面禁用几种枪支。' },
        { w: 'phenomenal', p: '/fɪˈnɒmɪn(ə)l/', cn: 'adj. 非凡的；出众的', ex: 'The results have been phenomenal.', ez: '成果是非凡的。' },
        { w: 'momentum', p: '/məˈmentəm/', cn: 'n. 动量；势头', ex: 'Governments often lose momentum in their second term of office.', ez: '政府往往会在第二届任期中丧失冲劲。' },
        { w: 'minority', p: '/maɪˈnɒrɪtɪ/', cn: 'n. 少数；少数民族', ex: 'Gaelic is still spoken in Ireland by a tiny minority.', ez: '爱尔兰仍有极少数人在说盖尔语。' },
        { w: 'inject', p: '/ɪnˈdʒekt/', cn: 'v. 注射；注入', ex: 'His son was injected with strong drugs.', ez: '他的儿子被注射了强效的药。' },
        { w: 'descend', p: '/dɪˈsend/', cn: 'v. 下降；下来', ex: 'I heard his footsteps descending the stairs.', ez: '我听到他下楼的脚步声。' },
        { w: 'melancholy', p: '/ˈmelənkəlɪ/', cn: 'n. 忧郁；悲哀 adj. 忧郁的；令人伤感的', ex: 'He sank into deep melancholy.', ez: '他陷入深深的忧郁之中。' },
        { w: 'contemporary', p: '/kənˈtemp(ə)r(ər)ɪ/', cn: 'adj. 同时代的；当代的', ex: 'She writes a lot of contemporary music for people like Whitney Houston.', ez: '她为惠特尼·休斯敦等人创作大量当代音乐作品。' },
        { w: 'layout', p: '/ˈleɪaʊt/', cn: 'n. 布置；设计', ex: 'All the flats in the building had the same layout.', ez: '大楼里所有的公寓布局都是一样的。' },
        { w: 'interpret', p: '/ɪnˈtɜːprɪt/', cn: 'v. 解释；说明', ex: 'They spoke good Spanish, and promised to interpret for me.', ez: '他们西班牙语说得很好，答应替我翻译。' },
        { w: 'shred', p: '/ʃred/', cn: 'n. 碎片；最少量 v. 撕碎', ex: 'Cut the cabbage into fine long shreds.', ez: '把这棵卷心菜切成细长条。' },
        { w: 'havoc', p: '/ˈhævək/', cn: 'n. 大灾难；浩劫', ex: 'Rain has continued to play havoc with sporting events.', ez: '下雨一直影响着体育比赛的进行。' },
        { w: 'ancestor', p: '/ˈænsestə/', cn: 'n. 祖先', ex: 'My ancestors were French.', ez: '我的祖先是法国人。' },
        { w: 'furnace', p: '/ˈfɜːnɪs/', cn: 'n. 炉子；熔炉', ex: 'It is time he banked up the furnace.', ez: '他该把炉子封起来了。' },
        { w: 'lever', p: '/ˈliːvə/', cn: 'n. 杆；杠杆 v. 用杠杆移动', ex: 'Pull this lever to open the gate.', ez: '拉此横杆开启大门。' },
        { w: 'vivid', p: '/ˈvɪvɪd/', cn: 'adj. 鲜艳的；活泼的', ex: 'He had a vivid picture of her in his mind.', ez: '他的脑海中清晰地留着她的形象。' },
        { w: 'array', p: '/əˈreɪ/', cn: 'n. 展示；一系列', ex: 'We visited the local markets and saw wonderful arrays of fruit and vegetables.', ez: '我们参观了当地的市场，看到了漂亮地摆放着的水果蔬菜。' },
        { w: 'attendance', p: '/əˈtend(ə)ns/', cn: 'n. 到场；出席人数', ex: 'We have an average attendance of 4,000 fans per game.', ez: '每场比赛平均有4,000名球迷来观战。' },
        { w: 'defect', p: '/ˈdiːfekt/', cn: 'n. 缺点；欠缺 v. 背叛', ex: 'All the cars are tested for defects before they leave the factory.', ez: '所有汽车在出厂前都经过品质检验。' },
        { w: 'reluctant', p: '/rɪˈlʌkt(ə)nt/', cn: 'adj. 不愿意的；勉强的', ex: 'She gave a reluctant smile.', ez: '她勉强笑了笑。' },
        { w: 'retain', p: '/rɪˈteɪn/', cn: 'v. 保持；保有', ex: 'The state wants to retain control of food imports.', ez: '政府想保留对食品进口的控制权。' },
        { w: 'aerial', p: '/ˈeərɪəl/', cn: 'adj. 空中的 n. 天线', ex: 'Weeks of aerial bombardment had destroyed factories and motorways.', ez: '数周的空袭已经摧毁了各工厂和公路。' },
        { w: 'clause', p: '/klɔːz/', cn: 'n. 条款；从句', ex: 'A confidentiality clause was added to the contract.', ez: '合同中加上了一项保密条款。' },
        { w: 'velocity', p: '/vəˈlɒsəti/', cn: 'n. 速度；速率', ex: 'The speedboat reached a velocity of 120 mph.', ez: '快艇的时速达到了120英里。' },
        { w: 'comply', p: '/kəmˈplaɪ/', cn: 'v. 遵守；照做', ex: 'The newspaper was asked by federal agents for assistance and agreed to comply.', ez: '联邦探员要求这家报社给予协助，报社同意配合。' },
        { w: 'credentials', p: '/krəˈdɛnʃlz/', cn: 'n. 资格证书；证件', ex: 'The commissioner presented his credentials to the State Department.', ez: '该委员向国务院递交了他的任职资格证书。' },
        { w: 'applaud', p: '/əˈplɔːd/', cn: 'v. 鼓掌欢迎；赞成', ex: 'The audience applauded loudly.', ez: '观众掌声雷动。' },
        { w: 'sparkle', p: '/ˈspɑːk(ə)l/', cn: 'v. 闪光；闪耀', ex: 'The crystal chandelier sparkled.', ez: '那水晶枝形吊灯闪闪发光。' },
        { w: 'neglect', p: '/nɪˈglekt/', cn: 'v. 忽视；搁置未做 n. 忽略；疏忽', ex: 'Many of these ideas have been neglected by modern historians.', ez: '这些观点有许多都被现代的历史学家忽略了。' },
        { w: 'superficial', p: '/ˌsuːpəˈfɪʃ(ə)l/', cn: 'adj. 表面的；表皮的', ex: 'They only have the most superficial understanding of prison life.', ez: '他们对监狱生活只有最粗浅的了解。' },
        { w: 'trustworthy', p: '/ˈtrʌs(t)wɜːðɪ/', cn: 'adj. 可信赖的；可靠的', ex: 'He is a trustworthy and level-headed leader.', ez: '他是个可信赖的、头脑冷静的领导。' },
        { w: 'dominate', p: '/ˈdɒmɪneɪt/', cn: 'v. 统治；支配', ex: 'New Orleans dominated throughout the game.', ez: '新奥尔良队自始至终都控制着这场比赛。' },
        { w: 'scatter', p: '/ˈskætə/', cn: 'v. 打散；撒', ex: 'The sound of gunfire made the crowd scatter in all directions.', ez: '枪声使人群四散奔逃。' },
        { w: 'digest', p: '/daɪˈdʒest/', cn: 'v. 消化；领会 n. 文摘；摘要', ex: 'Most babies can digest a wide range of food easily.', ez: '大多数婴儿能轻易地消化很多种食物。' },
        { w: 'casualty', p: '/ˈkæʒjʊəltɪ/', cn: 'n. 伤亡人员', ex: 'We have had our first casualty. One runner has dropped out with cramp.', ez: '我们有了第一位伤员，有一位队员因腿部痉挛退出了。' },
        { w: 'eligible', p: '/ˈelɪdʒɪb(ə)l/', cn: 'adj. 合格的；适宜的', ex: 'Stephen was regarded as an eligible bachelor.', ez: '斯蒂芬被认为是一个钻石王老五。' },
        { w: 'seemingly', p: '/ˈsiːmɪŋlɪ/', cn: 'adv. 好像；似乎', ex: 'A seemingly endless line of trucks waits in vain to load up.', ez: '看上去没有尽头的一排卡车徒劳地等着装货。' }
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

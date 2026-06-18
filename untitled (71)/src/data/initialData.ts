import { VideoContent, ArticleContent, CategoryItem } from '../types';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-quran',
    name: '经典研读',
    slug: 'classic-studies',
    description: '古兰经与圣训学术意境的华语译解与哲学探索',
    type: 'both',
    displayOrder: 1,
    icon: 'BookOpen'
  },
  {
    id: 'cat-history',
    name: '历史文化',
    slug: 'history-culture',
    description: '丝绸之路与华夏天方历史交往之学术考证',
    type: 'both',
    displayOrder: 2,
    icon: 'Compass'
  },
  {
    id: 'cat-art',
    name: '古典艺术',
    slug: 'classical-art',
    description: '中国宣纸中式书法（Sini）与清真寺营造美学',
    type: 'both',
    displayOrder: 3,
    icon: 'Feather'
  },
  {
    id: 'cat-lecture',
    name: '名家学术',
    slug: 'scholarly-lectures',
    description: '国内外宗教学者、历史哲学教授前沿专题演讲',
    type: 'video',
    displayOrder: 4,
    icon: 'Mic'
  }
];

export const INITIAL_VIDEOS: VideoContent[] = [
  {
    id: 'vid-silk-road',
    slug: 'ancient-silk-road-journey',
    title: '丝路古道行者无疆 (Ancient Silk Road Journey)',
    description: 'Cinematic film depicting the grand deserts of the ancient Silk Road. A lone traveler walks across the dunes at sunrise. Golden light, desert winds, peace, spiritual atmosphere, ultra realistic, epic camera movement, cinematic masterpiece, 4K.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-history',
    views: 12500,
    isFeatured: true,
    qualityLevels: ['1080P HD', '4K Ultra'],
    createdAt: new Date().toISOString(),
    authorName: '马学宁 博士',
    videoType: 'short',
    duration: 15,
    tags: ['Silk Road', 'Sunrise', 'Calligraphy', 'Traveler']
  },
  {
    id: 'vid-lanterns-peace',
    slug: 'lanterns-of-peace-glow',
    title: '和平之灯千家通明 (Lanterns of Peace)',
    description: 'Nighttime ancient city illuminated by thousands of floating lanterns. Lanterns transform into glowing symbols of peace and knowledge. Elegant architecture, reflective water, mystical atmosphere, luxury cinematic visuals, dramatic lighting, high detail, movie trailer quality.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-art',
    views: 8900,
    isFeatured: false,
    qualityLevels: ['1080P HD', '720P SD'],
    createdAt: new Date().toISOString(),
    authorName: '陈至一 学长',
    videoType: 'short',
    duration: 15,
    tags: ['Lanterns', 'Peace', 'Mystical', 'City']
  },
  {
    id: 'vid-jade-dragon',
    slug: 'jade-dragon-golden-light',
    title: '玉龙凌云金色光泽 (Jade Dragon and Golden Light)',
    description: 'A majestic jade dragon flies above misty mountains. As it moves through the clouds, golden light spreads across the landscape revealing beautiful gardens, rivers, and ancient palaces. Epic fantasy, cinematic drone shots, breathtaking visuals, ultra realistic, 4K.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-art',
    views: 15400,
    isFeatured: true,
    qualityLevels: ['1080P HD', '4K Ultra'],
    createdAt: new Date().toISOString(),
    authorName: '洪阿林 大师',
    videoType: 'short',
    duration: 15,
    tags: ['Jade Dragon', 'Mountains', 'Golden Light', 'Palaces']
  },
  {
    id: 'vid-lecture-quran',
    slug: 'chinese-quranic-translation-interpretation',
    title: '《古兰经》中国行：经典诠释与字义理解 (Chinese Scripture & Hermeneutics)',
    description: 'A comprehensive scholarly analysis by Acad. Ma Linjie on the history of translating sacred texts within the Chinese language workspace. This long academic lecture covers historical challenges, literal translations, and contextual exegesis.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-quran',
    views: 6200,
    isFeatured: true,
    qualityLevels: ['1080P HD', '720P SD'],
    createdAt: new Date().toISOString(),
    authorName: '马林杰 学术院士',
    videoType: 'long',
    duration: 600,
    tags: ['Hermeneutics', 'Scripture', 'Classic Studies']
  },
  {
    id: 'vid-lecture-history',
    slug: 'silk-road-civilization-dialogues',
    title: '丝绸之路上的中阿历史与古典交往座谈 (Silk Road Civilization Dialogues)',
    description: 'An exhaustive masterclass on theological and cultural dialogues across the historic maritime and terrestrial Silk Road networks, highlighting dynamic merchant and scholarly encounters.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-history',
    views: 7420,
    isFeatured: false,
    qualityLevels: ['1080P HD'],
    createdAt: new Date().toISOString(),
    authorName: '陈至一 教授',
    videoType: 'long',
    duration: 900,
    tags: ['Silk Road', 'Dialogue', 'Theology', 'History']
  },
  {
    id: 'vid-lecture-art',
    slug: 'sini-calligraphy-structural-woodwork',
    title: '古典中式宣纸书法与营造美学讲座 (Sini Calligraphy & Architectural Woodwork)',
    description: 'An open classroom tracing the breathtaking integration of Arabic scripture (Sini Calligraphy) onto traditional dougong timber frames and stone carvings in ancient Chinese mosques.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-art',
    views: 4180,
    isFeatured: false,
    qualityLevels: ['1080P HD', '4K Ultra'],
    createdAt: new Date().toISOString(),
    authorName: '洪阿林 馆长',
    videoType: 'long',
    duration: 720,
    tags: ['Calligraphy', 'Woodwork', 'Mosques', 'Architecture']
  }
];

export const INITIAL_ARTICLES: ArticleContent[] = [
  {
    id: 'art-understanding-reason',
    slug: 'islamic-epistemology-eastern-philosophy',
    title: '求知之光：伊斯兰认识论与宋代理学的契合',
    summary: '本文从比较哲学视角出发，考证了中世纪伊斯兰自然哲学家（如伊本·西那等）对“理性（Aql）”的推崇，并将其与宋明理学中关于“致知”与“格物”的论述进行对比，揭示两个伟大文明在追求真理与宇宙秩序上的深层共鸣。',
    content: `## 导言：追求知识的神圣性

在人类文明的长河中，对知识的渴望与对理性的尊崇，往往是推动精神升华的第一动力。伊斯兰学术传统将“求知”视为穆斯林的核心天职：

> “寻求知识，哪怕远在中国。” —— 传统格言的警示

而在中国的崇高精神世界中，《大学》首章亦言：  
*“古之欲明明德于天下者，先治其国；欲治其国者，先齐其家；欲齐其家者，先修其身；欲修其身者，先正其心；欲正其心者，先诚其意；欲诚其意者，先致其知；致知在格物。”*

### 第一章：格物致知与理性（Aql）的对应

中世纪黄金时代，伊本·西那（Avicenna）与伊本·鲁什德（Averroes）将古希腊的理性哲学引入经典研究，提出“纯粹理性”与“启示真理”并非相互排斥，而是如同两盏明灯照亮同一个方向。

理学奠基人朱熹对此亦有异曲同工之论。他认为：“天下之物，莫不有理。” 只有通过穷理、反思与躬行实践，才能够洞烛宇宙人生的真谛。在这一维度上：
1. **理性的主观求索**：人类的心灵（Aql）是一面镜子，只有拂去尘埃，才能映照万物之“理”。
2. **客观的知识格调**：宇宙是大至真者的无言之启示，天地自然中的一草一木，皆是神圣意志显化的绝对迹象（Ayat）。

---

### 第二章：“以儒诠经”的历史实证

明末清初，中文学术话语体系里涌现了伟大的“回儒学者”。他们生活在汉文化语境深处，用纯正的理学、心学词汇注解经典：

* **刘智（刘介廉）** 编撰《天方典礼》，将理学中的“理、气、道、心”完美对接伊斯兰神学中的“本体、本然、昭著”概念。
* **王岱舆** 在《正教真诠》里，用“真一”、“数一”、“体一”等概念构建出中国文人熟知的形而上学大厦。

这种学问被后世尊称为**“回儒学术”**（Han Kitab），不仅实现了精神和语言的飞跃，更确立了本土化进程中文化融会互通的典范。

---

### 结语：当代视野下的多维融通

今天，面对现代工具理性的迷失，经典世界中的**精神理性**再次展现出独特的解药价值。通过在中文语境下重读这些天方智识，我们不仅能重建对神圣生命的敬畏，亦可在多元大同社会中，播撒下相互理解与和平的文明之种。`,
    coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-quran',
    views: 3450,
    readTime: 8,
    isFeatured: true,
    draft: false,
    createdAt: new Date().toISOString(),
    authorName: '蒲先知 教授',
    authorRole: '东方文明比较研究所 主任',
    seoTitle: '求知之光：伊斯兰学术认识论与中国经典哲学的和鸣',
    seoDescription: '本文从比较哲学视角出发，探讨了中理理学与天方认识论对理性、格物致知与神圣知识的契合，梳理明清以儒诠经汉学经典刘智的学术精神。'
  },
  {
    id: 'art-brick-aesthetics',
    slug: 'carving-art-chinese-mosques',
    title: '砖雕流徽：古典中式清真寺浮雕的图腾与意境',
    summary: '本文揭示了中国早期清真建筑中极具雅致的饰件工艺。从菊花、莲花等植物文样的砖雕拓印，到竹报平安等汉字行楷石刻，折射出古代穆斯林群体对华夏吉祥美学的向往与信仰气节的坚守。',
    content: `## 砖雕美术的本土叙事

中国各地的历史清真建筑（如牛街清真寺、同心清真大寺、喀什艾提尕尔大寺）在其漫长的扩建和装饰流程中，无一不沾染了极为深厚的本土石刻砖雕印记。

### 第一章：几何纹样与多重寓意的巧妙避讳

众所周知，经典艺术在视觉上有着极为明确的避讳原则：禁止塑造具象的神明或动物实体。然而，这一限制并未削弱中国工匠的创造力，反而促成了极其精致繁复的几何图案与植物纹样的诞生：

1. **岁寒三友（松竹梅）**：在北方诸多清真寺大门照壁上，常能见到精美的松竹梅砖雕，用来隐喻信士对艰难困苦时局的坚韧，以及人格上的冰清玉洁。
2. **太极缠枝莲**：巧妙交织的金色或墨色莲花图案，代表着精神的至圣无染。

> “出淤泥而不染，濯清涟而不妖。” —— 这种完美的品格，既是儒家君子的极致追求，亦是信士持守信仰的一面镜子。

---

### 第二章：行楷笔意与阿拉伯书法

在中国西北某些清真壁照上，阿拉伯名言（如清真言、太斯米）被以中国传统的硬笔或砖刻刻划，甚至模仿中式屏风、牌匾和对联的形式。这不仅方便了当地华语读者的认知，也使得外来经典在形式上穿上了华夏文明的典雅外衣。

通过对石灰、青砖的精心敲击雕琢，工匠们留下了几百年不朽的信仰印记，让我们至今在青砖灰瓦之下，仍能触摸到沉静而高绝的灵魂之美。`,
    coverUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
    category: 'cat-art',
    views: 1290,
    readTime: 5,
    isFeatured: false,
    draft: false,
    createdAt: new Date().toISOString(),
    authorName: '马学宁 博士',
    authorRole: '非物质文化遗产 特聘研究员',
    seoTitle: '砖雕流徽：古典中式清真寺浮雕的吉祥图腾意境',
    seoDescription: '通过对中国具有代表性的古代清真建筑砖雕壁画的美学分析，解读松竹梅、缠枝莲等植物图腾如何寓意高洁信仰。'
  }
];

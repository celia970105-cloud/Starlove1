import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageType = "zh-TW" | "zh-CN" | "en";

export interface TranslationDict {
  [key: string]: {
    "zh-TW": string;
    "zh-CN": string;
    "en"?: string;
  };
}

export const translations: TranslationDict = {
  // General
  all_for_jiyu: {
    "zh-TW": "ALL FOR JIYU",
    "zh-CN": "ALL FOR JIYU",
    "en": "ALL FOR JIYU",
  },
  starry_support: {
    "zh-TW": "星願應援盒 ✦",
    "zh-CN": "星愿应援盒 ✦",
    "en": "Starry Support Box ✦",
  },
  home_portal: {
    "zh-TW": "星願傳送門",
    "zh-CN": "星愿传送门",
    "en": "Starry Portal",
  },
  admin_panel: {
    "zh-TW": "管理員控台",
    "zh-CN": "管理员控台",
    "en": "Admin Panel",
  },
  my_profile: {
    "zh-TW": "應援足跡",
    "zh-CN": "应援足迹",
    "en": "My Profile",
  },
  logout: {
    "zh-TW": "登出帳號 ✦",
    "zh-CN": "登出账号 ✦",
    "en": "Log Out ✦",
  },

  // Modules
  gallery: {
    "zh-TW": "相片應援",
    "zh-CN": "相片应援",
    "en": "Photo Support",
  },
  video: {
    "zh-TW": "影音珍藏",
    "zh-CN": "影音珍藏",
    "en": "Video Treasure",
  },
  letters: {
    "zh-TW": "紙短情長",
    "zh-CN": "纸短情长",
    "en": "Love Letters",
  },
  museum: {
    "zh-TW": "星願畫廊",
    "zh-CN": "星愿画廊",
    "en": "Starry Gallery",
  },
  pets: {
    "zh-TW": "星寵家園",
    "zh-CN": "星宠家园",
    "en": "Star Pet Home",
  },

  // Home Page Content
  hero_title: {
    "zh-TW": "極禹 TOP 1 雙向奔赴",
    "zh-CN": "极禹 TOP 1 双向奔赴",
    "en": "JIYU TOP 1 Mutual Support",
  },
  hero_sub: {
    "zh-TW": "在這裡記錄每一次的悸動，與星光共同編織極禹的應援足跡。",
    "zh-CN": "在这里记录每一次的悸动，与星光共同编制极禹的应援足迹。",
    "en": "Record every heart flutter here, weaving the starry support of JIYU together.",
  },
  portal_tip: {
    "zh-TW": "點擊這顆主星進入星願傳送門！✨",
    "zh-CN": "点击这颗主星进入星愿传送门！✨",
    "en": "Click this main star to enter the Starry Portal! ✨",
  },
  companion_bubble_prefix: {
    "zh-TW": "星寵小夥伴碎碎念：",
    "zh-CN": "星宠小伙伴碎碎念：",
    "en": "Star Pet Whisper:",
  },

  // User Module
  login: {
    "zh-TW": "立即登入 ✦",
    "zh-CN": "立即登入 ✦",
    "en": "Log In ✦",
  },
  register: {
    "zh-TW": "註冊帳號 ✦",
    "zh-CN": "注册账号 ✦",
    "en": "Register ✦",
  },
  quick_join: {
    "zh-TW": "快速玩 / 一鍵訪客加入 🚀",
    "zh-CN": "快速玩 / 一键访客加入 🚀",
    "en": "Quick Play / One-Click Guest Join 🚀",
  },
  guest_mode: {
    "zh-TW": "臨時訪客",
    "zh-CN": "临时访客",
    "en": "Guest Visitor",
  },
  guest_tip: {
    "zh-TW": "您目前使用臨時訪客帳號。請升級為正式應援帳號以免資料丟失：",
    "zh-CN": "您目前使用临时访客账号。请升级为正式应援账号以免资料丢失：",
    "en": "You are currently using a guest account. Upgrade to a formal account to prevent data loss:",
  },
  upgrade_title: {
    "zh-TW": "升級為正式應援帳號 ✦",
    "zh-CN": "升级为正式应援账号 ✦",
    "en": "Upgrade to Official Account ✦",
  },
  upgrade_btn: {
    "zh-TW": "綁定信箱密碼，一鍵升級 🚀",
    "zh-CN": "绑定信箱密码，一键升级 🚀",
    "en": "Bind Email & Password, Upgrade Now 🚀",
  },
  username_label: {
    "zh-TW": "應援暱稱 Username",
    "zh-CN": "应援昵称 Username",
    "en": "Username",
  },
  email_label: {
    "zh-TW": "正式信箱 Email *",
    "zh-CN": "正式信箱 Email *",
    "en": "Email Address *",
  },
  password_label: {
    "zh-TW": "設定密碼 Password *",
    "zh-CN": "设定密码 Password *",
    "en": "Set Password *",
  },
  submission_history: {
    "zh-TW": "我的應援投稿歷史紀錄",
    "zh-CN": "我的应援投稿历史纪录",
    "en": "My Submission History",
  },

  // Gallery (Photo)
  publish_photo: {
    "zh-TW": "發布相片應援 📸",
    "zh-CN": "发布相片应援 📸",
    "en": "Publish Photo Support 📸",
  },
  upload_photo_title: {
    "zh-TW": "相片標題 *",
    "zh-CN": "相片标题 *",
    "en": "Photo Title *",
  },
  upload_photo_url: {
    "zh-TW": "相片網址 (URL) *",
    "zh-CN": "相片网址 (URL) *",
    "en": "Photo URL *",
  },
  upload_photo_desc: {
    "zh-TW": "留下想對極禹說的祝福語吧！",
    "zh-CN": "留下想对极禹说的祝福语吧！",
    "en": "Write a message for JIYU!",
  },
  photo_year: {
    "zh-TW": "活動年份 *",
    "zh-CN": "活动年份 *",
    "en": "Event Year *",
  },
  photo_category: {
    "zh-TW": "相片分類 *",
    "zh-CN": "相片分类 *",
    "en": "Category *",
  },

  // Video
  publish_video: {
    "zh-TW": "上傳珍藏影音 🎬",
    "zh-CN": "上传珍藏影音 🎬",
    "en": "Upload Video Treasure 🎬",
  },
  video_title: {
    "zh-TW": "影片名稱 *",
    "zh-CN": "影片名称 *",
    "en": "Video Name *",
  },
  video_url: {
    "zh-TW": "影片網址 (Bilibili/YouTube/MP4) *",
    "zh-CN": "影片网址 (Bilibili/YouTube/MP4) *",
    "en": "Video URL (Bilibili/YouTube/MP4) *",
  },

  // Letters
  send_letter: {
    "zh-TW": "投遞紙短情長信件 💌",
    "zh-CN": "投递纸短情长信件 💌",
    "en": "Send Love Letter 💌",
  },
  letter_content: {
    "zh-TW": "信件內容 *",
    "zh-CN": "信件内容 *",
    "en": "Letter Content *",
  },
  letter_author: {
    "zh-TW": "署名 / 暱稱 *",
    "zh-CN": "署名 / 昵称 *",
    "en": "Signature / Nickname *",
  },

  // Museum
  publish_artwork: {
    "zh-TW": "投遞星願畫作 🎨",
    "zh-CN": "投递星愿画作 🎨",
    "en": "Submit Starry Artwork 🎨",
  },
  artwork_title: {
    "zh-TW": "作品名稱 *",
    "zh-CN": "作品名称 *",
    "en": "Artwork Title *",
  },
  artwork_url: {
    "zh-TW": "畫作網址 (Image URL) *",
    "zh-CN": "画作网址 (Image URL) *",
    "en": "Artwork URL (Image URL) *",
  },

  // Music
  publish_music: {
    "zh-TW": "投稿應援音樂 🎵",
    "zh-CN": "投稿应援音乐 🎵",
    "en": "Submit Support Music 🎵",
  },
  music_title: {
    "zh-TW": "音樂名稱 *",
    "zh-CN": "音乐名称 *",
    "en": "Song Name *",
  },
  music_url: {
    "zh-TW": "音訊網址 (MP3/OGG) *",
    "zh-CN": "音讯网址 (MP3/OGG) *",
    "en": "Audio URL (MP3/OGG) *",
  },
  music_artist: {
    "zh-TW": "歌手 / 製作人 *",
    "zh-CN": "歌手 / 制作人 *",
    "en": "Singer / Producer *",
  },
};

// Traditional to Simplified Chinese character mapping
const tcToScPairs = [
  "應应", "願愿", "欄栏", "備备", "實实", "寵宠", "畫画", "庫库", "園园", "歷历",
  "錄录", "帳帐", "號号", "碼码", "區区", "體体", "簡简", "繁繁", "尋寻", "網网",
  "頁页", "觀观", "影影", "歡欢", "迎迎", "傳传", "門门", "聽听", "說说", "讀读",
  "寫写", "報报", "審审", "核核", "發发", "創创", "熱热", "餵喂", "養养", "親亲",
  "飽饱", "認认", "領领", "離离", "開开", "關关", "聯联", "點点", "擊击", "寶宝",
  "貝贝", "暱昵", "稱称", "註注", "冊册", "確确", "密密", "訪访", "客客", "設设",
  "史史", "記记", "投投", "稿稿", "通通", "過过", "拒拒", "絕绝", "待待", "刪删",
  "除除", "操操", "作作", "數数", "據据", "載载", "錯错", "誤误", "興兴", "趣趣",
  "談谈", "話话", "貼贴", "條条", "留留", "言言", "壁壁", "照照", "片片", "像像",
  "廊廊", "彈弹", "幕幕", "播播", "放放", "音音", "樂乐", "歌歌", "詞词", "器器",
  "屬属", "性性", "升升", "級级", "幣币", "經经", "驗验", "力力", "清清", "單单",
  "幫帮", "好好", "友友", "搜搜", "添添", "加加", "房房", "間间", "小小", "窩窝",
  "互互", "動动", "食食", "玩玩", "耍耍", "撫抚", "摸摸", "散散", "步步", "帶带",
  "回回", "伴伴", "手手", "禮礼", "驚惊", "喜喜", "快快", "樂乐", "溫温", "馨馨",
  "提提", "示示", "定定", "取取", "消消", "標标", "題题", "內内", "容容", "布布",
  "網网", "址址", "類类", "別别", "年年", "份份", "建建", "於于", "批批", "準准",
  "駁驳", "管管", "理理", "員员", "權权", "限限", "配配", "色色", "筆笔", "橡橡",
  "皮皮", "擦擦", "填填", "滿满", "空空", "保保", "存存", "撤撤", "銷销", "重重",
  "做做", "預预", "覽览", "量量", "最最", "新新", "現现", "精精", "選选", "首首",
  "送送", "應应", "援援", "紙纸", "短短", "情情", "長长", "封封", "信信", "專专",
  "屬属", "祝祝", "福福", "盒盒", "當当", "前前", "無无", "贊赞", "助助", "板板",
  "表表", "復复", "舉举", "報报", "閉闭", "側侧", "邊边", "進进", "入入", "出出",
  "口口", "轉转", "移移", "綁绑", "郵邮", "箱箱", "頭头", "像像", "背背", "景景",
  "自自", "義义", "交交", "表表", "中中", "請请", "稍稍", "候候", "訴诉", "檢检",
  "索索", "社社", "規规", "範范", "違违", "詳详", "情情", "由由", "被被", "處处",
  "度度", "難难", "時时", "間间", "狀状", "態态", "未未", "已已", "准准", "追追",
  "問问", "次次", "度度", "人人", "氣气", "量量", "票票", "支支", "持持", "排排",
  "行行", "榜榜", "第第", "一一", "輯辑", "評评", "論论", "按按", "收收", "藏藏",
  "分分", "享享", "複复", "製制", "鏈链", "接接", "功功", "失失", "敗败", "裝装",
  "飾饰", "效效", "靜静", "置置", "偏偏", "主主", "題题", "切切", "換换", "語语",
  "言言", "繁繁", "體体", "雙双", "奔奔", "赴赴", "站站", "繪绘", "藝艺", "術术",
  "聲声", "劇剧", "場场", "找找", "誰谁", "獸兽", "貓猫", "狗狗", "魚鱼", "鳥鸟",
  "飛飞", "躍跃", "跳跳", "舞舞", "唱唱", "簽签", "名名", "計计", "圖图", "運运",
  "輸输", "鍵键", "盤盘", "鼠鼠", "標标", "豐丰", "富富", "飢饥", "餓饿", "夥伙",
  "碎碎", "念念", "陸陆", "臨临", "後后", "公公", "批批", "彈弹", "說说", "明明",
  "訊讯", "譜谱", "暫暂", "停停", "隨随", "機机", "順顺", "序序", "曲曲", "循循",
  "環环", "沒没", "該该", "用戶户", "週周", "慶庆", "副副", "塗涂", "鴉鸦", "櫥橱",
  "窗窗", "物物", "獲获", "益益", "獎奖", "勵励", "視视", "頻频", "覆复", "檢检",
  "舉举", "範范", "違违", "屏屏", "蔽蔽", "訴诉", "修修", "改改", "密密", "碼码",
  "重重", "設设", "郵邮", "箱箱", "確确", "定定", "提提", "示示", "意意",
  "愛爱", "憂忧", "聽听", "體体", "國国", "華华", "東东", "車车", "紅红", "藍蓝",
  "綠绿", "黃黄", "龍龙", "風风", "義义", "天天", "頭头", "親亲", "貝贝", "買买",
  "賣卖", "讀读", "書书", "與与", "萬万", "個个", "豐丰", "臨临", "麗丽", "舉举",
  "烏乌", "樂乐", "喬乔", "習习", "鄉乡", "亂乱", "爭争", "於于", "亞亚", "產产",
  "親亲", "貳贰", "發发", "罰罚", "閥阀", "髮发", "煩烦", "範范", "飛飞",
  "墳坟", "奮奋", "糞分", "風风", "豐丰", "鋒锋", "鳳凤", "撫抚", "輔辅", "復复",
  "婦妇", "崗岗", "廣广", "歸归", "龜龟", "軌轨", "詭诡", "貴贵", "過过", "畫画",
  "話话", "懷怀", "壞坏", "歡欢", "環环", "還还", "緩缓", "換换", "喚唤", "煥换",
  "會会", "繪绘", "匯汇", "諱讳", "誨诲", "獲获", "擊击", "機机", "極极", "積积",
  "劑剂", "濟济", "擠挤", "幾几", "際际", "繼继", "紀纪", "夾夹", "間间", "艱难",
  "檢检", "見见", "漸渐", "劍剑", "薦荐", "賤贱", "踐践", "艦舰", "將将", "獎奖",
  "驕骄", "膠胶", "澆浇", "嬌娇", "攪搅", "轎轿", "較较", "階阶", "節节", "傑杰",
  "潔洁", "結结", "誡诫", "屆届", "緊紧", "錦锦", "僅仅", "謹记", "進进", "晉晋",
  "燼极", "驚惊", "競竞", "鏡镜", "經经", "鯨鲸", "靜静", "靚靓", "舊旧", "駒驹",
  "舉举", "劇剧", "懼惧", "決决", "絕绝", "軍军", "駿骏", "開开", "凱凯", "顆颗",
  "殼壳", "課课", "墾恳", "懇恳", "摳抠", "庫库", "寬宽", "礦矿", "曠旷", "況况",
  "虧亏", "窺窥", "蘭兰", "攔栏", "欄栏", "覽览", "懶懒", "爛烂", "濫滥", "撈捞",
  "勞劳", "澇涝", "樂乐", "類类", "壘垒", "淚泪", "籬篱", "禮礼", "裡里", "裏里",
  "鯉鲤", "麗丽", "倆俩", "聯联", "蓮莲", "連连", "憐怜", "臉脸", "鏈链", "戀恋",
  "兩两", "亮亮", "諒谅", "療疗", "遼辽", "獵猎", "臨临", "鄰邻", "鱗鳞", "凜凛",
  "賃赁", "齡龄", "鈴铃", "靈灵", "嶺岭", "領领", "餾馏", "劉刘", "龍龙", "聾聋",
  "嚨咙", "壟垄", "攏拢", "樓楼", "蘆芦", "顱颅", "鱸鲈", "陸陆", "錄录", "賂赂",
  "綠绿", "鸞鸾", "亂乱", "輪轮", "論论", "羅罗", "邏逻", "鑼锣", "騾骡", "滿满",
  "邁迈", "麥麦", "賣卖", "蠻蛮", "饅馒", "瞞瞒", "貓猫", "錨锚", "門门", "們们",
  "悶闷", "盟盟", "矇蒙", "濛蒙", "朦蒙", "覓觅", "綿绵", "緬缅", "廟庙", "滅灭",
  "閩闽", "鳴鸣", "銘铭", "謬谬", "謀谋", "畝亩", "難难", "鈉钠", "腦脑", "惱脑",
  "鬧闹", "內内", "擬拟", "濘泞", "寧宁", "紐钮", "農农", "濃浓", "膿脓", "瘧疟",
  "諾诺", "歐欧", "謳讴", "盤盘", "闢辟", "騙骗", "飄飘", "頻频", "貧贫", "憑凭",
  "評评", "潑泼", "頗颇", "撲扑", "鋪铺", "樸朴", "譜谱", "齊齐", "臍脐", "騎骑",
  "豈体", "啟启", "氣气", "棄弃", "訖讫", "器器", "遷迁", "簽签", "謙谦", "錢钱",
  "鉗钳", "乾干", "潛潜", "淺浅", "譴谴", "強强", "牆墙", "槍枪", "親亲", "寢寝",
  "頃顷", "輕轻", "傾倾", "慶庆", "瓊琼", "窮穷", "區区", "軀躯", "趨趋", "渠渠",
  "勸劝", "確确", "讓让", "擾扰", "繞绕", "熱热", "韌韧", "認认", "紉纫", "榮荣",
  "絨绒", "軟软", "銳锐", "瑞瑞", "閏闰", "灑洒", "薩萨", "殺杀", "曬晒", "刪删",
  "閃闪", "贍赡", "繕缮", "傷伤", "賞赏", "燒烧", "紹绍", "賒赊", "攝摄", "設设",
  "紳饰", "審审", "嬸婶", "腎肾", "滲渗", "聲声", "勝胜", "聖圣", "師师", "獅狮",
  "濕湿", "詩诗", "時时", "實实", "識饰", "適适", "蝕蚀", "視视", "試试", "勢势",
  "獸兽", "熟熟", "數数", "樞枢", "書书", "贖赎", "屬属", "術术", "樹树", "豎竖",
  "雙双", "誰谁", "稅税", "順顺", "說说", "碩硕", "絲丝", "飼饲", "聳耸", "慫怂",
  "頌颂", "訴诉", "肅肃", "雖虽", "隨随", "歲岁", "碎碎", "孫孙", "損损", "縮缩",
  "瑣琐", "鎖锁", "態态", "攤摊", "貪贪", "癱瘫", "灘滩", "壇坛", "談谈", "坦坦",
  "毯毯", "嘆叹", "湯汤", "燙烫", "濤涛", "逃逃", "套套", "騰腾", "體体", "屜屉",
  "剃剃", "緹缇", "條条", "鐵铁", "聽听", "廳厅", "頭头", "圖图", "塗涂", "團团",
  "頹颓", "蛻蜕", "駝驼", "橢椭", "襪袜", "彎弯", "灣湾", "萬万", "網网", "韋韦",
  "違违", "圍围", "緯纬", "偉伟", "偽伪", "謂谓", "衛卫", "溫温", "聞闻", "紋纹",
  "穩稳", "問问", "無无", "吳吴", "蕪芜", "務务", "霧雾", "犧牺", "習习", "襲袭",
  "洗洗", "戲戏", "細细", "蝦虾", "轄辖", "峽峡", "俠侠", "狹侠", "廈厦", "鮮鲜",
  "纖纤", "鹹咸", "賢贤", "銜衔", "顯显", "憲宪", "縣县", "現现", "獻献", "羨羡",
  "線线", "詳详", "響响", "餉饷", "鄉乡", "向向", "項项", "蕭萧", "銷销", "曉晓",
  "嘯啸", "協协", "寫写", "脅胁", "洩泄", "謝谢", "鋅锌", "興兴", "繡绣", "鏽锈",
  "須须", "虛虚", "許许", "敘叙", "緒绪", "續续", "軒轩", "懸悬", "選选", "旋旋",
  "學学", "詢询", "尋寻", "馴驯", "訓训", "訊讯", "遜逊", "壓压", "鴨鸭", "亞亚",
  "訝讶", "閹阉", "煙烟", "鹽盐", "嚴严", "顏颜", "鴦鸯", "楊杨", "揚扬", "瘍扬",
  "陽阳", "養养", "樣样", "么么", "堯尧", "鑰钥", "藥药", "耀耀", "葉叶", "頁页",
  "業业", "醫医", "儀仪", "遺遗", "頤颐", "蟻蚁", "億亿", "憶忆", "藝艺", "議议",
  "譯译", "異异", "繹绎", "蔭荫", "銀银", "飲饮", "隱隐", "嬰婴", "櫻樱", "鸚鹦",
  "應应", "纓缨", "迎迎", "營营", "螢萤", "影影", "穎颖", "喲哟", "傭佣", "擁拥",
  "湧涌", "優优", "憂忧", "郵邮", "猶犹", "遊游", "餘余", "輿舆", "魚鱼", "與与",
  "嶼屿", "語语", "預预", "馭驭", "籲吁", "禦御", "淵渊", "遠远", "願愿", "約约",
  "躍跃", "鑰钥", "粵粤", "悅悦", "閱阅", "雲云", "運运", "醞酝", "暈晕", "雜杂",
  "災灾", "載载", "臟脏", "遭遭", "糟糟", "鑿凿", "棗枣", "責责", "擇择", "澤泽",
  "賊贼", "贈赠", "紮扎", "閘闸", "鍘铡", "債债", "斬斩", "盞盏", "展展", "嶄崭",
  "棧栈", "戰战", "佔占", "張张", "漲涨", "帳帐", "賬账", "釗钊", "趙赵", "這这",
  "折折", "針针", "偵侦", "診诊", "鎮镇", "陣阵", "睜睁", "織织", "職职", "執执",
  "紙纸", "製制", "質质", "緻致", "智智", "滯滞", "終终", "鐘钟", "腫肿", "種种",
  "眾众", "重重", "晝昼", "皺皱", "驟骤", "豬猪", "諸诸", "燭烛", "矚瞩", "著著",
  "助助", "築筑", "注注", "專专", "磚砖", "轉转", "賺赚", "莊庄", "裝装", "妝妆",
  "壯壮", "狀状", "錐锥", "墜坠", "綴缀", "贅赘", "準准", "濁浊", "茲兹", "資资",
  "漬渍", "諮咨", "詢询", "縱纵", "總总", "鄒邹", "詛诅", "組组", "鑽钻"
];

const tcToSc: Record<string, string> = {};
for (const pair of tcToScPairs) {
  if (pair.length === 2) {
    tcToSc[pair[0]] = pair[1];
  }
}

const enPhrases: [string, string][] = [
  ["帳號升級成功！您現在可以使用任何設備登入了。", "Account successfully upgraded! You can now log in on any device."],
  ["發布相片應援 📸", "Submit Photo Support 📸"],
  ["發布相片應援", "Submit Photo Support"],
  ["相片標題 *", "Photo Title *"],
  ["相片標題", "Photo Title"],
  ["相片網址 (URL) *", "Photo URL *"],
  ["相片網址", "Photo URL"],
  ["活動年份 *", "Event Year *"],
  ["活動年份", "Event Year"],
  ["相片分類 *", "Photo Category *"],
  ["相片分類", "Photo Category"],
  ["留下想對極禹說的祝福語吧！", "Leave your wishes for Jiyu here!"],
  ["上傳珍藏影音 🎬", "Upload Video Treasure 🎬"],
  ["上傳珍藏影音", "Upload Video Treasure"],
  ["影片名稱 *", "Video Name *"],
  ["影片名稱", "Video Name"],
  ["影片網址 *", "Video URL *"],
  ["影片網址", "Video URL"],
  ["影片描述", "Video Description"],
  ["投遞紙短情長信件", "Send Love Letter"],
  ["信件內容 *", "Letter Content *"],
  ["信件內容", "Letter Content"],
  ["署名 / 暱稱 *", "Signature / Nickname *"],
  ["署名 / 暱稱", "Signature / Nickname"],
  ["投遞星願畫作 🎨", "Submit Starry Artwork 🎨"],
  ["投遞星願畫作", "Submit Starry Artwork"],
  ["作品名稱 *", "Artwork Title *"],
  ["作品名稱", "Artwork Title"],
  ["畫作網址", "Artwork URL"],
  ["投稿應援音樂 🎵", "Submit Support Music 🎵"],
  ["投稿應援音樂", "Submit Support Music"],
  ["音樂名稱 *", "Song Name *"],
  ["音樂名稱", "Song Name"],
  ["音訊網址", "Audio URL"],
  ["主唱人 *", "Artist *"],
  ["主唱人", "Artist"],
  ["添加好友", "Add Friend"],
  ["沒有好友", "No friends yet"],
  ["我的好友清單", "My Friends List"],
  ["共養小窩", "Co-parenting Room"],
  ["星寵名字", "Pet Name"],
  ["星星幣", "Star Coins"],
  ["飽食度", "Fullness"],
  ["親密度", "Affection"],
  ["餵食星寵", "Feed Pet"],
  ["玩耍星寵", "Play with Pet"],
  ["餵食", "Feed"],
  ["摸摸/玩耍", "Pet/Play"],
  ["全部類別", "All Categories"],
  ["全部年份", "All Years"],
  ["重新整理", "Refresh"],
  ["管理員審核系統", "Admin Audit System"],
  ["全部投稿", "All Submissions"],
  ["待審核", "Pending"],
  ["已通過", "Approved"],
  ["已拒絕", "Rejected"],
  ["投稿人", "Submitter"],
  ["投稿類型", "Type"],
  ["內容", "Content"],
  ["狀態", "Status"],
  ["操作", "Action"],
  ["通過", "Approve"],
  ["拒絕", "Reject"],
  ["刪除", "Delete"],
  ["審核中", "Reviewing"],
  ["已批准", "Approved"],
  ["已駁回", "Rejected"],
  ["已刪除", "Deleted"],
  ["星應站管理", "Star Support Admin"],
  ["確定", "Confirm"],
  ["返回", "Back"],
  ["首頁", "Home"],
  ["傳送門", "Portal"],
  ["畫廊", "Gallery"],
  ["相簿", "Album"],
  ["相片", "Photo"],
  ["影音", "Video"],
  ["信箱", "Letters"],
  ["博物館", "Museum"],
  ["寵物", "Pets"],
  ["管理", "Admin"],
  ["在線繪圖板", "Online Canvas"],
  ["星願音樂盒", "Starry Music Box"],
  ["目前無播放音樂", "No music playing"],
  ["點擊播放", "Click to play"],
  ["歌曲列表", "Song List"],
  ["正在播放", "Now Playing"],
  ["暫停", "Pause"],
  ["播放", "Play"],
  ["隨機播放", "Shuffle"],
  ["順序播放", "Sequential"],
  ["單曲循環", "Loop One"],
  ["靜音", "Mute"],
  ["取消靜音", "Unmute"],
  ["歡迎回來", "Welcome back"],
  ["設定成功", "Settings success"],
  ["登出帳號 ✦", "Log Out ✦"],
  ["登出帳號", "Log Out"],
  ["立即登入 ✦", "Log In ✦"],
  ["立即登入", "Log In"],
  ["快速玩 / 一鍵訪客加入 🚀", "Quick Play / Guest Join 🚀"],
  ["快速加入 ✦", "Quick Join ✦"],
  ["快速加入", "Quick Join"],
  ["註冊帳號 ✦", "Register Account ✦"],
  ["註冊帳號", "Register Account"],
  ["臨時訪客", "Guest Visitor"],
  ["已提交", "Submitted"],
  ["繁體中文", "Traditional Chinese"],
  ["簡體中文", "Simplified Chinese"],
  ["英文", "English"],
  ["年份：", "Year: "],
  ["類別：", "Category: "],
  ["暱稱：", "Nickname: "],
  ["頭像：", "Avatar: "],
  ["背景：", "Background: "],
  ["自定義", "Customize"],
  ["提交", "Submit"],
  ["登入", "Log In"],
  ["註冊", "Register"],
  ["登出", "Log Out"],
  ["帳號", "Account"],
  ["升級", "Upgrade"],
  ["轉移", "Transfer"],
  ["綁定", "Bind"],
  ["成功", "Success"],
  ["失敗", "Failure"],
  ["提示", "Notice"],
  ["警告", "Warning"],
  ["演唱會舞台", "Concert Stage"],
  ["運動會", "Sports Meet"],
  ["外務", "External Schedule"],
  ["幕後花絮", "Behind the Scenes"],
  ["日常應援", "Daily Support"],
  ["同人同好繪", "Fanart"],
  ["全部", "All"],
  ["年份", "Year"],
  ["類別", "Category"],
  ["暱稱", "Nickname"],
  ["頭像", "Avatar"],
  ["背景", "Background"],
  ["取消", "Cancel"],
  ["確認", "Confirm"],
  ["確定", "Confirm"],
  ["添加", "Add"]
];

export function translateString(text: string, targetLang: LanguageType): string {
  if (!text) return text;
  
  if (targetLang === "zh-TW") {
    return text;
  }
  
  let result = text;
  
  if (targetLang === "en") {
    // English translation by phrase replacement
    for (const [tc, en] of enPhrases) {
      if (result.includes(tc)) {
        result = result.replaceAll(tc, en);
      }
    }
    return result;
  }
  
  if (targetLang === "zh-CN") {
    // Simplified Chinese character-by-character conversion
    let scResult = "";
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      scResult += tcToSc[char] || char;
    }
    return scResult;
  }
  
  return text;
}

export function safeClosest(el: any, selector: string): boolean {
  try {
    if (el && typeof el.closest === "function") {
      return !!el.closest(selector);
    }
  } catch (e) {
    // Ignore DOMExceptions from closest() on SVGs or disconnected nodes in certain browsers
  }
  return false;
}

export function applyTranslation(root: Node, lang: LanguageType) {
  // Translate text nodes using TreeWalker
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (parent) {
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "iframe" || tag === "textarea") {
        continue;
      }
      // Skip home-hero-title as requested by the user
      if (safeClosest(parent, "#home-hero-title") || safeClosest(parent, "[data-no-translate]")) {
        continue;
      }
    }

    const value = node.nodeValue;
    if (!value || !value.trim()) continue;

    // Save or update original value
    if ((node as any).__originalValue === undefined) {
      (node as any).__originalValue = value;
    } else {
      const prevOrig = (node as any).__originalValue;
      const prevTranslated = translateString(prevOrig, lang);
      if (value !== prevTranslated && value !== prevOrig) {
        (node as any).__originalValue = value;
      }
    }

    const orig = (node as any).__originalValue;
    const translated = translateString(orig, lang);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  // Translate placeholders of inputs & textareas
  const inputs = document.querySelectorAll("input, textarea");
  inputs.forEach((inputEl) => {
    const el = inputEl as HTMLInputElement | HTMLTextAreaElement;
    if (safeClosest(el, "#home-hero-title") || safeClosest(el, "[data-no-translate]")) {
      return;
    }
    const placeholder = el.getAttribute("placeholder");
    if (placeholder) {
      if ((el as any).__originalPlaceholder === undefined) {
        (el as any).__originalPlaceholder = placeholder;
      } else {
        const prevOrig = (el as any).__originalPlaceholder;
        const prevTranslated = translateString(prevOrig, lang);
        if (placeholder !== prevTranslated && placeholder !== prevOrig) {
          (el as any).__originalPlaceholder = placeholder;
        }
      }
      const orig = (el as any).__originalPlaceholder;
      const translated = translateString(orig, lang);
      if (el.getAttribute("placeholder") !== translated) {
        el.setAttribute("placeholder", translated);
      }
    }
  });

  // Translate select option text contents
  const options = document.querySelectorAll("option");
  options.forEach((optEl) => {
    const el = optEl as HTMLOptionElement;
    if (safeClosest(el, "#home-hero-title") || safeClosest(el, "[data-no-translate]")) {
      return;
    }
    const text = el.textContent;
    if (text) {
      if ((el as any).__originalText === undefined) {
        (el as any).__originalText = text;
      } else {
        const prevOrig = (el as any).__originalText;
        const prevTranslated = translateString(prevOrig, lang);
        if (text !== prevTranslated && text !== prevOrig) {
          (el as any).__originalText = text;
        }
      }
      const orig = (el as any).__originalText;
      const translated = translateString(orig, lang);
      if (el.textContent !== translated) {
        el.textContent = translated;
      }
    }
  });
}

interface LanguageContextProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>(() => {
    const saved = localStorage.getItem("starry_support_lang");
    return (saved as LanguageType) || "zh-TW";
  });

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem("starry_support_lang", lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      return key;
    }
    return translations[key][language] || translations[key]["zh-TW"] || key;
  };

  useEffect(() => {
    // Apply initial translation
    applyTranslation(document.body, language);

    // Setup MutationObserver to automatically translate dynamically added or changed content
    const observer = new MutationObserver(() => {
      observer.disconnect();
      applyTranslation(document.body, language);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

import { Actor } from '../types';

export const actors: Actor[] = [
  {
    slug: 'suzuki-hiroki',
    name: '鈴木 拡樹',
    kana: 'すずき ひろき',
    profile: '1985年6月4日生まれ、大阪府出身。舞台『刀剣乱舞』三日月宗近役や『最遊記歌劇伝』玄奘三蔵役などで知られる実力派俳優。',
    imageUrl: '/actors/suzuki-hiroki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/hiroki_0604',
      official: 'https://suzuki-hiroki.jp/'
    },
    // 更新: 義伝を追加
    featuredPlaySlugs: ['touken-ranbu-stage', 'touken-ranbu-stage-giden', 'saiyuki-kagekiden', 'moriarty-musical', 'yowapeda-interhigh-first', 'k-stage-first', 'psychopass-stage-vv1', 'yuyu-hakusho-stage'],
    tags: ['実力派', '2.5次元トップランナー']
  },
  {
    slug: 'aramaki-yoshihiko',
    name: '荒牧 慶彦',
    kana: 'あらまき よしひこ',
    profile: '1991年2月5日生まれ、東京都出身。舞台『刀剣乱舞』山姥切国広役をはじめ、数多くの人気作で主演を務める。',
    imageUrl: '/actors/aramaki-yoshihiko.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ara_mackey',
      instagram: 'https://www.instagram.com/aramaki.yoshihiko/',
      official: 'https://aramaki-yoshihiko.com/'
    },
    // 更新: 義伝を追加
    featuredPlaySlugs: ['touken-ranbu-stage', 'touken-ranbu-stage-giden', 'enstars-stage', 'k-stage-first', 'ace-stage-aw', 'yuyu-hakusho-stage', 'touken-ranbu-stage-joden'],
    tags: ['王子様系', '殺陣が得意']
  },
  {
    slug: 'wada-masanari',
    name: '和田 雅成',
    kana: 'わだ まさなり',
    profile: '1991年9月5日生まれ、大阪府出身。舞台『刀剣乱舞』へし切長谷部役や舞台『おそ松さん』カラ松役など、ツッコミ役からクールな役まで幅広くこなす。',
    imageUrl: '/actors/wada-masanari.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/masanari6',
      official: 'https://wadamasanari.com/'
    },
    // 更新: 義伝を追加
    featuredPlaySlugs: ['touken-ranbu-stage', 'touken-ranbu-stage-giden', 'osomatsu-stage', 'jujutsu-kaisen-stage', 'psychopass-stage-vv1', 'touken-ranbu-stage-joden'],
    tags: ['ツッコミ', '関西出身']
  },
  {
    slug: 'sato-ryuji',
    name: '佐藤 流司',
    kana: 'さとう りゅうじ',
    profile: '1995年1月17日生まれ、宮城県出身。ミュージカル『刀剣乱舞』加州清光役、ライブ・スペクタクル『NARUTO-ナルト-』うちはサスケ役など。バンド活動も行う。',
    imageUrl: '/actors/sato-ryuji.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ryuji7117',
      instagram: 'https://www.instagram.com/ryuji_sato_117/',
    },
    // 更新: 幕末を追加
    featuredPlaySlugs: ['touken-ranbu-musical', 'touken-ranbu-musical-bakumatsu', 'naruto-stage', 'jujutsu-kaisen-stage', 'naruto-stage-akatsuki'],
    tags: ['アーティスト', 'カリスマ']
  },
  {
    slug: 'kitamura-ryo',
    name: '北村 諒',
    kana: 'きたむら りょう',
    profile: '1991年1月25日生まれ、東京都出身。モデルとしても活動。舞台『刀剣乱舞』薬研藤四郎役、『あんさんぶるスターズ！オン・ステージ』鳴上嵐役など。',
    imageUrl: '/actors/kitamura-ryo.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ryo_kitamu',
      instagram: 'https://www.instagram.com/ryo_kitamura/',
    },
    featuredPlaySlugs: ['touken-ranbu-stage', 'enstars-stage', 'heroaca-stage', 'yowapeda-interhigh-first', 'tokyo-revengers-stage', 'osomatsu-stage', 'naruto-stage-akatsuki'],
    tags: ['モデル出身', '美形']
  },
  {
    slug: 'suga-kenta',
    name: '須賀 健太',
    kana: 'すが けんた',
    profile: '1994年10月19日生まれ、東京都出身。子役時代から培った演技力と高い身体能力で、ハイパープロジェクション演劇『ハイキュー!!』日向翔陽役など熱量の高い役柄を演じる。',
    imageUrl: '/actors/suga-kenta.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/suga_kenta1019',
      instagram: 'https://www.instagram.com/sugakenta1019/'
    },
    // 更新: 烏野復活を追加
    featuredPlaySlugs: ['haikyu-stage', 'haikyu-stage-fukkatsu'],
    tags: ['演技派', '身体能力']
  },
  {
    slug: 'kimura-tatsunari',
    name: '木村 達成',
    kana: 'きむら たつなり',
    profile: '1993年12月8日生まれ、東京都出身。ハイパープロジェクション演劇『ハイキュー!!』影山飛雄役で注目を集め、現在はグランドミュージカルでも活躍中。',
    imageUrl: '/actors/kimura-tatsunari.jpg',
    gender: 'male',
    sns: {
      official: 'https://kimuratatsunari.com/'
    },
    // 更新: 烏野復活を追加
    featuredPlaySlugs: ['haikyu-stage', 'haikyu-stage-fukkatsu'],
    tags: ['長身', 'ミュージカル']
  },
  {
    slug: 'hirano-ryo',
    name: '平野 良',
    kana: 'ひらの りょう',
    profile: '1984年5月20日生まれ、神奈川県出身。ミュージカル『憂国のモリアーティ』シャーロック・ホームズ役など、知的な役からコミカルな役まで幅広く演じ分ける。',
    imageUrl: '/actors/hirano-ryo.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/hiraryo0520',
      official: 'https://lineblog.me/hiranoryo/'
    },
    featuredPlaySlugs: ['moriarty-musical'],
    tags: ['カメレオン俳優', '脚本・演出']
  },
  {
    slug: 'tamura-shin',
    name: '田村 心',
    kana: 'たむら しん',
    profile: '1995年10月24日生まれ、東京都出身。『僕のヒーローアカデミア』The “Ultra” Stage 緑谷出久役で主演を務め、真っ直ぐな演技で観客を魅了する。',
    imageUrl: '/actors/tamura-shin.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/shinta1024',
      instagram: 'https://www.instagram.com/shin_tamura_1024/'
    },
    featuredPlaySlugs: ['heroaca-stage'],
    tags: ['熱血', '歌唱力']
  },
  {
    slug: 'kobayashi-ryota',
    name: '小林 亮太',
    kana: 'こばやし りょうた',
    profile: '1998年12月16日生まれ、愛知県出身。『仮面ライダーアマゾンズ』など映像作品でも活躍。『僕のヒーローアカデミア』The “Ultra” Stage 爆豪勝己役など。',
    imageUrl: '/actors/kobayashi-ryota.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ryotakobayashi_',
      instagram: 'https://www.instagram.com/ryota_kobayashi_official/'
    },
    featuredPlaySlugs: ['heroaca-stage', 'kimetsu-stage'],
    tags: ['アクション', 'ライダー出身']
  },
  {
    slug: 'yokota-ryugi',
    name: '横田 龍儀',
    kana: 'よこた りゅうぎ',
    profile: '1994年9月9日生まれ、福島県出身。ジュノン・スーパーボーイ・コンテスト審査員特別賞受賞。MANKAI STAGE『A3!』佐久間咲也役としてリーダーシップを発揮する。',
    imageUrl: '/actors/yokota-ryugi.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/0909Ryugi',
      official: 'https://yokota-ryugi.com/'
    },
    featuredPlaySlugs: ['ace-stage-ss'],
    tags: ['フレッシュ', 'ダンス']
  },
  {
    slug: 'makishima-hikaru',
    name: '牧島 輝',
    kana: 'まきしま ひかる',
    profile: '1995年8月3日生まれ、埼玉県出身。MANKAI STAGE『A3!』碓氷真澄役で人気を博し、ミュージカル『刀剣乱舞』大倶利伽羅役など、クールで存在感のある役柄が多い。',
    imageUrl: '/actors/makishima-hikaru.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/maximum083',
      instagram: 'https://www.instagram.com/hikaru_makishima/'
    },
    featuredPlaySlugs: ['ace-stage-ss', 'kingdom-stage'],
    tags: ['クール', '歌唱力']
  },
  {
    slug: 'tateishi-toshiki',
    name: '立石 俊樹',
    kana: 'たていし としき',
    profile: '1993年12月19日生まれ、秋田県出身。ダンス＆ボーカルグループIVVYのメンバー。MANKAI STAGE『A3!』茅ヶ崎至役など、端正なルックスと甘い歌声で魅了する。',
    imageUrl: '/actors/tateishi-toshiki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ivvy_toshiki',
      instagram: 'https://www.instagram.com/toshiki_tateishi/'
    },
    featuredPlaySlugs: ['ace-stage-ss'],
    tags: ['アーティスト', '王子様系']
  },
  {
    slug: 'furuta-kazuki',
    name: '古田 一紀',
    kana: 'ふるた かずき',
    profile: '1995年11月29日生まれ、東京都出身。ミュージカル『テニスの王子様』3rdシーズンで主人公・越前リョーマ役を務め、鮮烈なデビューを飾った。',
    imageUrl: '/actors/furuta-kazuki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/real_kazuki_f'
    },
    featuredPlaySlugs: ['tennimu-3rd-fudomine', 'tennimu-3rd-hyotei'],
    tags: ['テニミュ', '演技派']
  },
  {
    slug: 'zaiki-takuma',
    name: '財木 琢磨',
    kana: 'ざいき たくま',
    profile: '1992年10月15日生まれ、福岡県出身。ミュージカル『テニスの王子様』3rdシーズン手塚国光役で注目を集め、ミュージカル『刀剣乱舞』大倶利伽羅役（初代）なども務める。',
    imageUrl: '/actors/zaiki-takuma.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/takuma_zaiki',
      official: 'https://zaiki-takuma.com/'
    },
    featuredPlaySlugs: ['tennimu-3rd-fudomine', 'tennimu-3rd-hyotei'],
    tags: ['長身', '硬派']
  },
  {
    slug: 'ueda-keisuke',
    name: '植田 圭輔',
    kana: 'うえだ けいすけ',
    profile: '1989年9月5日生まれ、大阪府出身。舞台『鬼滅の刃』我妻善逸役や『文豪ストレイドッグス』中原中也役など、小柄ながら爆発的なエネルギーを持つ演技が持ち味。',
    imageUrl: '/actors/ueda-keisuke.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/uechan_0905',
      official: 'https://uedakeisuke.com/'
    },
    featuredPlaySlugs: ['kimetsu-stage', 'yowapeda-interhigh-first', 'bungo-stage', 'k-stage-first', 'world-trigger-stage', 'osomatsu-stage'],
    tags: ['ベテラン', 'ツッコミ']
  },
  {
    slug: 'sato-yugo',
    name: '佐藤 祐吾',
    kana: 'さとう ゆうご',
    profile: '1994年8月29日生まれ、北海道出身。舞台『鬼滅の刃』嘴平伊之助役での身体表現や、ミュージカル『テニスの王子様』3rdシーズン木更津淳/亮役などで活躍。',
    imageUrl: '/actors/sato-yugo.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/satoyugodesu'
    },
    featuredPlaySlugs: ['kimetsu-stage'],
    tags: ['フィジカル', '声優活動']
  },
  {
    slug: 'furukawa-yuta',
    name: '古川 雄大',
    kana: 'ふるかわ ゆうた',
    profile: '1987年7月9日生まれ、長野県出身。ミュージカル『黒執事』セバスチャン役や『テニスの王子様』不二周助役を経て、現在は『エリザベート』トート役などグランドミュージカル界のプリンスとして活躍。',
    imageUrl: '/actors/furukawa-yuta.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/furukawa_staff',
      official: 'https://www.ken-on.co.jp/furukawa/'
    },
    featuredPlaySlugs: ['kuroshitsuji-circus'],
    tags: ['ミュージカル', 'プリンス']
  },
  {
    slug: 'uchikawa-reo',
    name: '内川 蓮生',
    kana: 'うちかわ れお',
    profile: '2004年6月22日生まれ、東京都出身。子役として活動し、ミュージカル『黒執事』〜NOAH’S ARK CIRCUS〜でシエル・ファントムハイヴ役を好演した。',
    imageUrl: '/actors/uchikawa-reo.jpg',
    gender: 'male',
    sns: {
      instagram: 'https://www.instagram.com/reo_uchikawa/'
    },
    featuredPlaySlugs: ['kuroshitsuji-circus'],
    tags: ['子役出身', '演技派']
  },
  {
    slug: 'miura-ryosuke',
    name: '三浦 涼介',
    kana: 'みうら りょうすけ',
    profile: '1987年2月16日生まれ、東京都出身。『仮面ライダーオーズ/OOO』アンク役で人気を博す。ミュージカル『黒執事』ジョーカー役など、独特の美学と存在感を持つ。',
    imageUrl: '/actors/miura-ryosuke.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ryosukemiura216',
      official: 'https://ryosuke.miura.official-site.jp/'
    },
    featuredPlaySlugs: ['kuroshitsuji-circus', 'jujutsu-kaisen-stage'],
    tags: ['アーティスト', '個性派']
  },
  {
    slug: 'murai-ryouta',
    name: '村井 良大',
    kana: 'むらい りょうた',
    profile: '1988年6月29日生まれ、東京都出身。舞台『弱虫ペダル』小野田坂道役（初代）としてシリーズの礎を築いた。現在は舞台を中心にドラマや映画でも活躍。',
    imageUrl: '/actors/murai-ryouta.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/ryota_muraidesu',
      official: 'https://murairyota.com/'
    },
    featuredPlaySlugs: ['yowapeda-interhigh-first'],
    tags: ['座長', '実力派']
  },
  {
    slug: 'hirose-tomoki',
    name: '廣瀬 智紀',
    kana: 'ひろせ ともき',
    profile: '1987年2月14日生まれ、埼玉県出身。舞台『弱虫ペダル』巻島裕介役や舞台『刀剣乱舞』鶯丸役など、独特の空気感と美貌で人気を博す。',
    imageUrl: '/actors/hirose-tomoki.jpg',
    gender: 'male',
    sns: {
      instagram: 'https://www.instagram.com/tomoki_hirose_official/',
      official: 'https://ameblo.jp/tomoki-hirose/'
    },
    featuredPlaySlugs: ['yowapeda-interhigh-first'],
    tags: ['天然', '美形']
  },
  {
    slug: 'torigoe-yuki',
    name: '鳥越 裕貴',
    kana: 'とりごえ ゆうき',
    profile: '1991年3月31日生まれ、大阪府出身。舞台『文豪ストレイドッグス』中島敦役やミュージカル『刀剣乱舞』大和守安定役など、明るいキャラクターからシリアスな役まで幅広く演じる。',
    imageUrl: '/actors/torigoe-yuki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/Torippiyo2',
      instagram: 'https://www.instagram.com/yuki_torigoe.cleft/'
    },
    // 更新: 幕末を追加
    featuredPlaySlugs: ['bungo-stage', 'touken-ranbu-musical-bakumatsu'],
    tags: ['ムードメーカー', 'ダンス']
  },
  {
    slug: 'tawada-hideya',
    name: '多和田 任益',
    kana: 'たわだ ひでや',
    profile: '1993年11月5日生まれ、大阪府出身。舞台『文豪ストレイドッグス』太宰治役での長身を活かしたスタイリッシュな演技が話題。振付師としても活動。',
    imageUrl: '/actors/tawada-hideya.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/hideyatawada',
      instagram: 'https://www.instagram.com/tawadahideya_official/'
    },
    featuredPlaySlugs: ['bungo-stage', 'world-trigger-stage'],
    tags: ['長身', 'ダンサー']
  },
  {
    slug: 'hashimoto-shohei',
    name: '橋本 祥平',
    kana: 'はしもと しょうへい',
    profile: '1993年12月31日生まれ、神奈川県出身。舞台『文豪ストレイドッグス』芥川龍之介役や舞台『刀剣乱舞』太鼓鐘貞宗役など。ドラム演奏も得意とする。',
    imageUrl: '/actors/hashimoto-shohei.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/hashimotoshohey',
      official: 'https://hashimoto-shohei.com/'
    },
    featuredPlaySlugs: ['bungo-stage', 'yuyu-hakusho-stage'],
    tags: ['ドラム', '愛されキャラ']
  },
  {
    slug: 'takano-akira',
    name: '高野 洸',
    kana: 'たかの あきら',
    profile: '1997年7月22日生まれ、福岡県出身。Dream5としてデビュー。『ヒプノシスマイク』山田一郎役、ミュージカル『刀剣乱舞』膝丸役など、圧倒的なダンススキルと華を持つ。',
    imageUrl: '/actors/takano-akira.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/AKIRAT_official',
      instagram: 'https://www.instagram.com/akira_takano_official/',
      official: 'https://takano-akira.net/'
    },
    featuredPlaySlugs: ['hypnosismic-stage-track1', 'touken-ranbu-musical-souki2019', 'kingdom-stage'],
    tags: ['ダンス', 'アーティスト']
  },
  {
    slug: 'abe-alan',
    name: '阿部 顕嵐',
    kana: 'あべ あらん',
    profile: '1997年8月30日生まれ、東京都出身。7ORDERのメンバー。『ヒプノシスマイク』碧棺左馬刻役など、クールなビジュアルと熱いパフォーマンスで魅了する。',
    imageUrl: '/actors/abe-alan.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/alanabe_official',
      instagram: 'https://www.instagram.com/alanabe_official/',
      official: 'https://alanabe.com/'
    },
    featuredPlaySlugs: ['hypnosismic-stage-track1'],
    tags: ['アーティスト', 'クール']
  },
  {
    slug: 'matsuda-ryo',
    name: '松田 凌',
    kana: 'まつだ りょう',
    profile: '1991年9月13日生まれ、兵庫県出身。ミュージカル『薄桜鬼』斎藤一役で鮮烈デビュー。舞台『東京リベンジャーズ』佐野万次郎役など、小柄ながらキレのあるアクションと憑依型の演技が魅力。',
    imageUrl: '/actors/matsuda-ryo.jpg',
    gender: 'male',
    sns: {
      official: 'https://matsuda-ryo.com/'
    },
    featuredPlaySlugs: ['hakuoki-musical-saito', 'tokyo-revengers-stage', 'k-stage-first'],
    tags: ['演技派', 'アクション']
  },
  {
    slug: 'suzuki-shogo',
    name: '鈴木 勝吾',
    kana: 'すずき しょうご',
    profile: '1989年2月4日生まれ、神奈川県出身。『侍戦隊シンケンジャー』でデビュー。ミュージカル『薄桜鬼』風間千景役や『憂国のモリアーティ』ウィリアム役など、圧倒的な歌唱力と存在感を誇る。',
    imageUrl: '/actors/suzuki-shogo.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/Shogo_Suzuki_',
      official: 'https://smiling-days.com/'
    },
    featuredPlaySlugs: ['hakuoki-musical-saito', 'moriarty-musical'],
    tags: ['歌唱力', '熱演']
  },
  {
    slug: 'kizu-tsubasa',
    name: '木津 つばさ',
    kana: 'きづ つばさ',
    profile: '1998年1月7日生まれ、広島県出身。舞台『東京リベンジャーズ』花垣武道役やミュージカル『刀剣乱舞』博多藤四郎役など、体当たりの演技といじられキャラで愛される。',
    imageUrl: '/actors/kizu-tsubasa.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/kizu_tsubasa',
      instagram: 'https://www.instagram.com/tsubasa__kizu/'
    },
    featuredPlaySlugs: ['tokyo-revengers-stage', 'yuyu-hakusho-stage', 'touken-ranbu-stage-joden'],
    tags: ['ツッコミ', '愛されキャラ']
  },
  {
    slug: 'jinnai-sho',
    name: '陳内 将',
    kana: 'じんない しょう',
    profile: '1988年1月16日生まれ、熊本県出身。『特命戦隊ゴーバスターズ』エンター役で注目。舞台『東京リベンジャーズ』ドラケン役やMANKAI STAGE『A3!』皇天馬役など、リーダー気質の役柄が多い。',
    imageUrl: '/actors/jinnai-sho.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/chanjin0116',
      instagram: 'https://www.instagram.com/chanjin0116/'
    },
    featuredPlaySlugs: ['tokyo-revengers-stage'],
    tags: ['リーダー', 'コメディ']
  },
  {
    slug: 'kiyama-haruki',
    name: '丘山 晴己',
    kana: 'きやま はるき',
    profile: '1985年10月3日生まれ、東京都出身。アメリカと日本を拠点に活動。ブロードウェイ公演『The Illusionists』に初の日本人として出演するなど、世界レベルのダンサー・俳優。',
    imageUrl: '/actors/kiyama-haruki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/HARUKES',
      instagram: 'https://www.instagram.com/haruki_kiyama/',
      official: 'https://harukiyama.com/'
    },
    featuredPlaySlugs: ['mahoyaku-stage-chapter1'],
    tags: ['インターナショナル', 'ダンス']
  },
  {
    slug: 'kitagawa-naoya',
    name: '北川 尚弥',
    kana: 'きたがわ なおや',
    profile: '1996年5月15日生まれ、北海道出身。ジュノン・スーパーボーイ・コンテストファイナリスト。舞台『魔法使いの約束』アーサー役など、王子様キャラクターが似合う爽やかな容姿で人気。',
    imageUrl: '/actors/kitagawa-naoya.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/n_kitagawa0515',
      instagram: 'https://www.instagram.com/naoya_kitagawa/'
    },
    featuredPlaySlugs: ['mahoyaku-stage-chapter1'],
    tags: ['爽やか', '王子様']
  },
  {
    slug: 'yata-yusuke',
    name: '矢田 悠祐',
    kana: 'やた ゆうすけ',
    profile: '1990年11月16日生まれ、大阪府出身。ミュージカル『テニスの王子様』2ndシーズン不二周助役でデビュー。高い歌唱力を武器に、グランドミュージカルや舞台『魔法使いの約束』ファウスト役などで活躍。',
    imageUrl: '/actors/yata-yusuke.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/YusukeYata',
      instagram: 'https://www.instagram.com/yatarou_1116/'
    },
    featuredPlaySlugs: ['mahoyaku-stage-chapter1'],
    tags: ['歌唱力', '実力派']
  },
  {
    slug: 'miura-hiroki',
    name: '三浦 宏規',
    kana: 'みうら ひろき',
    profile: '1999年3月24日生まれ、三重県出身。5歳からクラシックバレエを始め、数々のコンクールで入賞。ミュージカル『刀剣乱舞』髭切役や『レ・ミゼラブル』マリウス役など、若き実力派として注目される。',
    imageUrl: '/actors/miura-hiroki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/hirokimiura0324',
      official: 'https://www.miurahiroki.com/'
    },
    featuredPlaySlugs: ['touken-ranbu-musical-souki2019', 'kingdom-stage', 'tennimu-3rd-hyotei'],
    tags: ['バレエ', 'ミュージカル']
  },
  {
    slug: 'yasue-kazuaki',
    name: '泰江 和明',
    kana: 'やすえ かずあき',
    profile: '1994年2月7日生まれ、大阪府出身。舞台『呪術廻戦』伏黒恵役や『新テニスの王子様』The First Stage 入江奏多役など。ダンスボーカルグループの経験も持つ。',
    imageUrl: '/actors/yasue-kazuaki.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/kazuaki_yasue',
      instagram: 'https://www.instagram.com/kazuaki_yasue/'
    },
    featuredPlaySlugs: ['jujutsu-kaisen-stage'],
    tags: ['ダンス', 'クール']
  },
  {
    slug: 'toyohara-erika',
    name: '豊原 江理佳',
    kana: 'とよはら えりか',
    profile: '1996年2月25日生まれ、ドミニカ共和国出身。ミュージカル『アニー』主演でデビュー。舞台『呪術廻戦』釘崎野薔薇役など、パワフルな歌声と演技で魅了する。',
    imageUrl: '/actors/toyohara-erika.jpg',
    gender: 'female',
    sns: {
      x: 'https://twitter.com/erika_lunat',
      instagram: 'https://www.instagram.com/erika_toyohara/'
    },
    featuredPlaySlugs: ['jujutsu-kaisen-stage'],
    tags: ['歌姫', 'バイリンガル']
  },
  {
    slug: 'mizue-kenta',
    name: '水江 建太',
    kana: 'みずえ けんた',
    profile: '1995年11月2日生まれ、東京都出身。MANKAI STAGE『A3!』摂津万里役、『ヒプノシスマイク』入間銃兎役など。長身のビジュアルと色気のある歌声が魅力。',
    imageUrl: '/actors/mizue-kenta.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/mizue_kenta',
      instagram: 'https://www.instagram.com/mizue_kenta/'
    },
    featuredPlaySlugs: ['ace-stage-aw', 'hypnosismic-stage-track1'],
    tags: ['長身', '色気']
  },
  {
    slug: 'fujita-ray',
    name: '藤田 玲',
    kana: 'ふじた れい',
    profile: '1988年9月6日生まれ、東京都出身。フランスと日本のハーフ。バンド「DUSTZ」のボーカル。MANKAI STAGE『A3!』古市左京役など、大人の色気と存在感で作品を締める。',
    imageUrl: '/actors/fujita-ray.jpg',
    gender: 'male',
    sns: {
      x: 'https://twitter.com/Ray_F_JT',
      official: 'http://fujitaray.com/'
    },
    featuredPlaySlugs: ['ace-stage-aw', 'naruto-stage-akatsuki'],
    tags: ['バイリンガル', 'ロック']
  }
];

export enum SceneType {
  // 户外场景 (原有并保留/优化)
  LAWN = '绿地草坪',
  BEACH = '阳光沙滩',
  LAKESIDE = '静谧湖边',
  FOREST = '深林秘境',
  MOUNTAIN = '雄伟山脉',
  DESERT = '荒漠戈壁',
  GARDEN = '私家花园',
  BACKYARD = '温馨后院',
  TERRACE = '户外露台',
  BALCONY = '景观阳台',
  ROOFTOP = '城市天台',
  CANYON = '红色峡谷',
  WATERFALL = '壮丽瀑布',
  JUNGLE = '热带丛林',
  FESTIVAL = '音乐节现场',
  CAMPSITE = '专业营地',
  PARK = '城市公园',
  SNOW_MOUNTAIN = '皑皑雪山',
  CLIFF = '惊险悬崖',
  STREAM = '林间小溪',
  MEADOW = '高山草甸',
  AUTUMN_WOODS = '金色秋林',
  SUNSET_COAST = '落日海岸',
  STARRY_NIGHT = '璀璨星空',
  MODERN_PATIO = '现代中庭',
  POOL_SIDE = '度假村泳池边',
  MISTY_FOREST = '晨雾森林',
  WILDERNESS = '荒野原野',
  CHERRY_GARDEN = '樱花盛放园',

  // 欧美室内场景 (新增 20+ 个)
  MODERN_LIVING_ROOM = '现代简约客厅 (欧美风)',
  COZY_BEDROOM = '温馨美式卧室',
  LUXURY_SUNROOM = '高端全景阳光房',
  INDUSTRIAL_LOFT = '工业风挑高阁楼',
  MINIMALIST_DINING = '极简北欧风餐厅',
  HOME_STUDY = '美式家庭书房',
  ATTIC_PLAYROOM = '阁楼儿童游戏室',
  MODERN_KITCHEN = '开放式现代厨房',
  GLASS_SOLARIUM = '西式玻璃日光室',
  VILLA_GRAND_HALL = '豪华别墅大厅',
  NORDIC_APARTMENT = '北欧宜家风公寓',
  VINTAGE_LIBRARY = '复古英伦图书馆',
  GARAGE_STUDIO = '美式车库工作室',
  INDOOR_POOL_SIDE = '室内恒温泳池区',
  HOME_GYM_AREA = '家庭私教健身房',
  BOHEMIAN_LOUNGE = '波西米亚风休息室',
  RUSTIC_LOG_CABIN = '乡村原木屋室内',
  FARMHOUSE_INTERIOR = '现代农舍风室内',
  PENTHOUSE_VIEW_ROOM = '顶层豪宅景观房',
  KIDS_BEDROOM = '梦幻欧美儿童房',
  ART_GALLERY_SPACE = '艺术展览感空间',
  WINE_LOUNGE = '私人酒窖休闲区',
  LUXURY_HOTEL_SUITE = '五星级酒店套房',
  URBAN_STUDIO = '都市开放式单间',
  HIGH_TECH_OFFICE = '科技感家庭办公室'
}

export enum FamilyType {
  NONE = '不显示人物 (仅展示产品)',
  CAUCASIAN_FOUR = '欧美人一家四口',
  ASIAN_FOUR = '亚洲人一家四口',
  HISPANIC_FOUR = '拉美裔一家四口',
  AFRICAN_AMERICAN_FOUR = '非裔一家四口',
  SOLO_CAMPER = '单人徒步者',
  COUPLE = '年轻情侣',
  ELDERLY_COUPLE = '老两口',
  GROUP_FRIENDS = '一群好友',
  PET_OWNER = '带宠物的人',
  PARENTS_INFANT = '带婴儿的父母'
}

export enum OutputAspectRatio {
  SQUARE = '1:1',
  CLASSIC_H = '4:3',
  CLASSIC_V = '3:4',
  CINEMATIC_H = '16:9',
  CINEMATIC_V = '9:16'
}

export interface GenerationConfig {
  scene: SceneType;
  family: FamilyType;
  aspectRatio: OutputAspectRatio;
  additionalPrompt: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: OutputAspectRatio;
}

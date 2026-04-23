import json
import random

provinces = ["北京", "上海", "广东", "江苏", "浙江", "山东", "河南", "四川", "湖北", "河北", "湖南", "安徽", "福建", "辽宁", "陕西", "江西", "重庆", "广西", "山西", "云南", "黑龙江", "吉林", "贵州", "新疆", "甘肃", "内蒙古", "海南", "宁夏", "青海", "西藏"]
cities_suffix = {"北京": ["市"], "上海": ["市"], "广东": ["广州", "深圳", "东莞", "佛山", "珠海"], "江苏": ["南京", "苏州", "无锡", "常州", "徐州"], "浙江": ["杭州", "宁波", "温州", "金华", "嘉兴"], "四川": ["成都", "绵阳", "德阳", "南充"], "山东": ["济南", "青岛", "烟台", "潍坊"]}
types = ["第一人民医院", "第二人民医院", "第三人民医院", "中心医院", "医科大学附属第一医院", "医科大学附属第二医院", "医科大学附属第三医院", "中医院", "妇幼保健院", "肿瘤医院", "市第一医院", "省人民医院", "大学第一附属医院", "医学院附属医院"]

hospitals = []
id_counter = 1

# Make sure we hit about 1000+
for prov in provinces:
    # 35 per province approx -> ~1050
    cities = cities_suffix.get(prov, ["市", "第一", "第二", "北区", "南区", "中心", "州", "新城", "高新"])
    for i in range(35):
        city = random.choice(cities)
        city_prefix = "" if city == "市" else city
        h_type = random.choice(types)
        
        name = f"{prov}省{city_prefix}{h_type}" if prov not in ["北京", "上海", "重庆", "天津"] else f"{prov}市{city_prefix}{h_type}"
        
        # Minor cleanup for names
        name = name.replace("省市", "省").replace("市市", "市")
        
        # Deduplication check pseudo
        if name not in [h["name"] for h in hospitals]:
            hospitals.append({
                "id": f"H{str(id_counter).zfill(4)}",
                "name": name,
                "region": prov,
                "level": "三甲"
            })
            id_counter += 1

# Sort by id
hospitals = sorted(hospitals, key=lambda x: x["id"])

with open("hospitals.json", "w", encoding="utf-8") as f:
    json.dump(hospitals, f, ensure_ascii=False, indent=2)

print(f"Generated {len(hospitals)} hospitals to hospitals.json.")

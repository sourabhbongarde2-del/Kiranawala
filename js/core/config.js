/* ================================================================
   BONGARDE MART – config.js
   1. Fill in your Firebase project values below
   2. Get them from: console.firebase.google.com
      → Project Settings → General → Your Apps → Firebase SDK snippet
   ================================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBLhidhauwICyH_0-WPcsRoQTRd6HNGgW0",
  authDomain:        "bongarde-mart.firebaseapp.com",
  databaseURL:       "https://bongarde-mart-default-rtdb.firebaseio.com",
  projectId:         "bongarde-mart",
  storageBucket:     "bongarde-mart.firebasestorage.app",
  messagingSenderId: "221016020353",
  appId:             "1:221016020353:web:105b028df3e3b909790480"
};

/* ── STORE SETTINGS (editable from Admin → Settings) ── */
const DEFAULT_SETTINGS = {
  storeName:        "Kirana Basket",
  storeTagline:     "Grocery Delivery – Belewadi Masa",
  storeAddr:        "Shop No.1, Belewadi Masa, Sangli – 416218",
  storePhone:       "8855020634",
  whatsapp:         "918855020634",
  upiId:            "bongarde@upi",
  upiName:          "Kirana Basket",
  minOrder:         199,
  delivFee:         30,
  freeDelivAt:      500,      // free delivery above this
  delivEta:         "~4 hrs", // standard delivery ETA
  instantMinOrder:  200,
  instantFee:       20,
  pickupEta:        "~30 min",
  deliveryPin:      "416218",
  ownerName:        "Sourabh Bongarde",
  ownerMobile:      "8855020634",
  adminPass:        "bongardemart@14",   // demo store ka default password — apna store banane ke liye register.html use karo
};

/* ── CATEGORIES ── */
const CATEGORIES = [
  { id:"all",       label:"All Items",        mr:"सर्व",        emoji:"🏪" },
  { id:"dairy",     label:"Dairy & Eggs",     mr:"दूध व अंडी",  emoji:"🥛" },
  { id:"grocery",   label:"Atta, Rice & Dal", mr:"धान्य",       emoji:"🌾" },
  { id:"oils",      label:"Oils & Ghee",      mr:"तेल व तूप",   emoji:"🫙" },
  { id:"spices",    label:"Spices & Masala",  mr:"मसाले",       emoji:"🌶️" },
  { id:"snacks",    label:"Snacks & Biscuits",mr:"स्नॅक्स",    emoji:"🍪" },
  { id:"beverages", label:"Beverages",        mr:"पेये",        emoji:"🥤" },
  { id:"bakery",    label:"Bread & Bakery",   mr:"बेकरी",       emoji:"🍞" },
  { id:"household", label:"Household",        mr:"घरगुती",      emoji:"🧹" },
  { id:"personal",  label:"Personal Care",    mr:"वैयक्तिक",   emoji:"🧴" },
];

/* ── COUPONS ── */
const COUPONS = {
  SAVE10:     { type:"percent", val:10,  desc:"10% off"  },
  BONGARDE20: { type:"flat",    val:20,  desc:"₹20 off"  },
  FIRST50:    { type:"flat",    val:50,  desc:"₹50 off"  },
};

/* ── UNIT PRESETS (shown in admin variant picker) ── */
const UNIT_PRESETS = [
  "100 g","200 g","250 g","500 g","1 kg","2 kg","5 kg","10 kg",
  "50 ml","100 ml","200 ml","250 ml","500 ml","1 L","2 L","5 L",
  "4 pcs","6 pcs","12 pcs","1 pc",
];

/* ── EMOJI PICKER ── */
const EMOJIS = [
  "🛍️","🥛","🍚","🌾","🧂","🫙","🌶️","🍪","🥤","🍞",
  "🧺","🧴","🥚","🧀","🧈","🍜","🥔","🌽","🧃","🥥",
  "🍬","🟡","🟤","🌱","🧼","🪥","🚿","🪣","🔶","🍽️",
];

/* ── DEFAULT BANNERS ── */
const DEFAULT_BANNERS = [
  { id:"b1", title:"🚚 Fast Home Delivery",    sub:"Free delivery on orders ₹500+",          bg:"linear-gradient(135deg,#0c831f,#056b16)", img:"" },
  { id:"b2", title:"⚡ Instant Delivery",       sub:"Get groceries in 2 hrs – only ₹20 extra",bg:"linear-gradient(135deg,#f59e0b,#b45309)", img:"" },
  { id:"b3", title:"🏷️ Use FIRST50",           sub:"₹50 off on your first order!",           bg:"linear-gradient(135deg,#7c3aed,#4c1d95)", img:"" },
];

/* ── INITIAL PRODUCTS (50 kirana items) ── */
/* Each product: { id, name, brand, cat, img, badge, stock, variants:[{label,price,mrp}] } */
const INITIAL_PRODUCTS = [
  // DAIRY
  { id:"d1",  name:"Amul Milk",           brand:"Amul",         cat:"dairy",    img:"🥛", badge:"",        stock:true, variants:[{label:"500 ml",price:17,mrp:17},{label:"1 L",price:32,mrp:32}] },
  { id:"d2",  name:"Mother Dairy Curd",   brand:"Mother Dairy", cat:"dairy",    img:"🥣", badge:"",        stock:true, variants:[{label:"200 g",price:20,mrp:22},{label:"400 g",price:35,mrp:40}] },
  { id:"d3",  name:"Amul Butter",         brand:"Amul",         cat:"dairy",    img:"🧈", badge:"",        stock:true, variants:[{label:"100 g",price:58,mrp:65},{label:"500 g",price:260,mrp:280}] },
  { id:"d4",  name:"Amul Cheese Slices",  brand:"Amul",         cat:"dairy",    img:"🧀", badge:"",        stock:true, variants:[{label:"100 g",price:60,mrp:68},{label:"200 g",price:105,mrp:120}] },
  { id:"d5",  name:"Country Eggs",        brand:"Farm Fresh",   cat:"dairy",    img:"🥚", badge:"FRESH",   stock:true, variants:[{label:"6 pcs",price:48,mrp:55},{label:"12 pcs",price:90,mrp:105}] },
  { id:"d6",  name:"Amul Paneer",         brand:"Amul",         cat:"dairy",    img:"🧀", badge:"FRESH",   stock:true, variants:[{label:"100 g",price:35,mrp:40},{label:"200 g",price:65,mrp:75}] },
  { id:"d7",  name:"Amul Ghee",           brand:"Amul",         cat:"dairy",    img:"🫙", badge:"",        stock:true, variants:[{label:"200 ml",price:130,mrp:145},{label:"500 ml",price:280,mrp:310}] },
  { id:"d8",  name:"Amul Lassi",          brand:"Amul",         cat:"dairy",    img:"🥛", badge:"",        stock:true, variants:[{label:"200 ml",price:20,mrp:22},{label:"500 ml",price:45,mrp:50}] },
  // GROCERY
  { id:"g1",  name:"Aashirvaad Atta",     brand:"Aashirvaad",   cat:"grocery",  img:"🌾", badge:"POPULAR", stock:true, variants:[{label:"1 kg",price:48,mrp:55},{label:"5 kg",price:210,mrp:245},{label:"10 kg",price:395,mrp:450}] },
  { id:"g2",  name:"India Gate Basmati",  brand:"India Gate",   cat:"grocery",  img:"🍚", badge:"",        stock:true, variants:[{label:"500 g",price:50,mrp:58},{label:"1 kg",price:95,mrp:110},{label:"5 kg",price:430,mrp:490}] },
  { id:"g3",  name:"Sona Masoori Rice",   brand:"Local",        cat:"grocery",  img:"🍚", badge:"",        stock:true, variants:[{label:"1 kg",price:60,mrp:68},{label:"5 kg",price:280,mrp:320}] },
  { id:"g4",  name:"Tata Sampann Toor Dal",brand:"Tata",        cat:"grocery",  img:"🟡", badge:"",        stock:true, variants:[{label:"500 g",price:65,mrp:75},{label:"1 kg",price:120,mrp:140}] },
  { id:"g5",  name:"Moong Dal",           brand:"Tata",         cat:"grocery",  img:"🟡", badge:"",        stock:true, variants:[{label:"250 g",price:35,mrp:40},{label:"500 g",price:65,mrp:75},{label:"1 kg",price:120,mrp:138}] },
  { id:"g6",  name:"Chana Dal",           brand:"Local",        cat:"grocery",  img:"🟤", badge:"",        stock:true, variants:[{label:"500 g",price:48,mrp:55},{label:"1 kg",price:90,mrp:105}] },
  { id:"g7",  name:"Sugar",               brand:"Local",        cat:"grocery",  img:"🍬", badge:"",        stock:true, variants:[{label:"500 g",price:23,mrp:25},{label:"1 kg",price:45,mrp:50}] },
  { id:"g8",  name:"Tata Salt",           brand:"Tata",         cat:"grocery",  img:"🧂", badge:"",        stock:true, variants:[{label:"500 g",price:11,mrp:12},{label:"1 kg",price:20,mrp:22}] },
  // OILS
  { id:"o1",  name:"Fortune Sunflower Oil",brand:"Fortune",     cat:"oils",     img:"🫙", badge:"",        stock:true, variants:[{label:"500 ml",price:78,mrp:88},{label:"1 L",price:145,mrp:165},{label:"2 L",price:275,mrp:310}] },
  { id:"o2",  name:"Saffola Gold Oil",    brand:"Saffola",      cat:"oils",     img:"🫙", badge:"",        stock:true, variants:[{label:"500 ml",price:90,mrp:100},{label:"1 L",price:175,mrp:195}] },
  { id:"o3",  name:"Patanjali Mustard Oil",brand:"Patanjali",   cat:"oils",     img:"🫙", badge:"",        stock:true, variants:[{label:"500 ml",price:68,mrp:78},{label:"1 L",price:130,mrp:145}] },
  { id:"o4",  name:"Parachute Coconut Oil",brand:"Parachute",   cat:"oils",     img:"🥥", badge:"",        stock:true, variants:[{label:"200 ml",price:50,mrp:58},{label:"500 ml",price:110,mrp:125}] },
  // SPICES
  { id:"sp1", name:"MDH Garam Masala",    brand:"MDH",          cat:"spices",   img:"🌶️",badge:"",        stock:true, variants:[{label:"50 g",price:30,mrp:35},{label:"100 g",price:55,mrp:65},{label:"200 g",price:100,mrp:115}] },
  { id:"sp2", name:"Everest Red Chilli",  brand:"Everest",      cat:"spices",   img:"🌶️",badge:"",        stock:true, variants:[{label:"50 g",price:25,mrp:30},{label:"100 g",price:45,mrp:55},{label:"200 g",price:85,mrp:98}] },
  { id:"sp3", name:"Tata Haldi Powder",   brand:"Tata",         cat:"spices",   img:"🟡", badge:"",        stock:true, variants:[{label:"100 g",price:20,mrp:24},{label:"200 g",price:35,mrp:42},{label:"500 g",price:80,mrp:95}] },
  { id:"sp4", name:"Jeera (Cumin)",       brand:"Local",        cat:"spices",   img:"🌱", badge:"",        stock:true, variants:[{label:"50 g",price:18,mrp:20},{label:"100 g",price:30,mrp:35},{label:"200 g",price:55,mrp:65}] },
  { id:"sp5", name:"Everest Dhaniya",     brand:"Everest",      cat:"spices",   img:"🟤", badge:"",        stock:true, variants:[{label:"100 g",price:18,mrp:22},{label:"200 g",price:30,mrp:38}] },
  // SNACKS
  { id:"s1",  name:"Parle-G Biscuit",     brand:"Parle",        cat:"snacks",   img:"🍪", badge:"POPULAR", stock:true, variants:[{label:"100 g",price:10,mrp:11},{label:"250 g",price:20,mrp:22},{label:"800 g",price:60,mrp:68}] },
  { id:"s2",  name:"Maggi Noodles",       brand:"Nestle",       cat:"snacks",   img:"🍜", badge:"",        stock:true, variants:[{label:"70 g",price:14,mrp:14},{label:"4 pack",price:52,mrp:56}] },
  { id:"s3",  name:"Lays Classic",        brand:"PepsiCo",      cat:"snacks",   img:"🥔", badge:"",        stock:true, variants:[{label:"26 g",price:10,mrp:10},{label:"52 g",price:20,mrp:20}] },
  { id:"s4",  name:"Kurkure Masala",      brand:"PepsiCo",      cat:"snacks",   img:"🌽", badge:"",        stock:true, variants:[{label:"45 g",price:10,mrp:10},{label:"90 g",price:20,mrp:20}] },
  { id:"s5",  name:"Hide & Seek",         brand:"Parle",        cat:"snacks",   img:"🍪", badge:"",        stock:true, variants:[{label:"100 g",price:30,mrp:35},{label:"200 g",price:56,mrp:65}] },
  { id:"s6",  name:"Cadbury Oreo",        brand:"Cadbury",      cat:"snacks",   img:"🍪", badge:"",        stock:true, variants:[{label:"58 g",price:20,mrp:22},{label:"120 g",price:30,mrp:35}] },
  { id:"s7",  name:"Bingo Mad Angles",    brand:"ITC",          cat:"snacks",   img:"🔶", badge:"",        stock:true, variants:[{label:"40 g",price:10,mrp:10},{label:"80 g",price:20,mrp:20}] },
  { id:"s8",  name:"Britannia Good Day",  brand:"Britannia",    cat:"snacks",   img:"🍪", badge:"",        stock:true, variants:[{label:"100 g",price:30,mrp:35},{label:"250 g",price:60,mrp:70}] },
  // BEVERAGES
  { id:"bv1", name:"Coca Cola",           brand:"Coca Cola",    cat:"beverages",img:"🥤", badge:"",        stock:true, variants:[{label:"250 ml",price:20,mrp:20},{label:"750 ml",price:40,mrp:40},{label:"2 L",price:95,mrp:100}] },
  { id:"bv2", name:"Sprite",              brand:"Coca Cola",    cat:"beverages",img:"🥤", badge:"",        stock:true, variants:[{label:"250 ml",price:20,mrp:20},{label:"750 ml",price:40,mrp:40}] },
  { id:"bv3", name:"Pepsi",               brand:"PepsiCo",      cat:"beverages",img:"🥤", badge:"",        stock:true, variants:[{label:"250 ml",price:18,mrp:20},{label:"750 ml",price:38,mrp:40}] },
  { id:"bv4", name:"Dabur Real Juice",    brand:"Dabur",        cat:"beverages",img:"🧃", badge:"",        stock:true, variants:[{label:"200 ml",price:30,mrp:35},{label:"1 L",price:90,mrp:105}] },
  { id:"bv5", name:"Frooti Mango",        brand:"Parle Agro",   cat:"beverages",img:"🧃", badge:"",        stock:true, variants:[{label:"125 ml",price:10,mrp:10},{label:"250 ml",price:18,mrp:20}] },
  // BAKERY
  { id:"ba1", name:"Harvest Gold Bread",  brand:"Harvest Gold", cat:"bakery",   img:"🍞", badge:"FRESH",   stock:true, variants:[{label:"400 g",price:35,mrp:40},{label:"800 g",price:65,mrp:75}] },
  { id:"ba2", name:"Pav",                 brand:"Local Bakery", cat:"bakery",   img:"🥖", badge:"FRESH",   stock:true, variants:[{label:"4 pcs",price:18,mrp:20},{label:"6 pcs",price:28,mrp:32}] },
  { id:"ba3", name:"Britannia Rusks",     brand:"Britannia",    cat:"bakery",   img:"🍞", badge:"",        stock:true, variants:[{label:"200 g",price:40,mrp:45},{label:"400 g",price:75,mrp:85}] },
  // HOUSEHOLD
  { id:"h1",  name:"Surf Excel Easy Wash",brand:"HUL",          cat:"household",img:"🧺", badge:"",        stock:true, variants:[{label:"500 g",price:65,mrp:75},{label:"1 kg",price:110,mrp:130},{label:"3 kg",price:280,mrp:320}] },
  { id:"h2",  name:"Vim Dish Wash Bar",   brand:"HUL",          cat:"household",img:"🍽️",badge:"",        stock:true, variants:[{label:"200 g",price:20,mrp:24},{label:"500 g",price:45,mrp:55}] },
  { id:"h3",  name:"Harpic Power Plus",   brand:"Reckitt",      cat:"household",img:"🚿", badge:"",        stock:true, variants:[{label:"500 ml",price:85,mrp:95},{label:"1 L",price:150,mrp:175}] },
  { id:"h4",  name:"Ariel Washing Powder",brand:"P&G",          cat:"household",img:"🧺", badge:"",        stock:true, variants:[{label:"500 g",price:95,mrp:110},{label:"1 kg",price:170,mrp:200}] },
  { id:"h5",  name:"Lizol Floor Cleaner", brand:"Reckitt",      cat:"household",img:"🪣", badge:"",        stock:true, variants:[{label:"500 ml",price:95,mrp:110},{label:"1 L",price:175,mrp:200}] },
  // PERSONAL CARE
  { id:"pc1", name:"Colgate Total",       brand:"Colgate",      cat:"personal", img:"🪥", badge:"",        stock:true, variants:[{label:"75 g",price:35,mrp:40},{label:"150 g",price:55,mrp:65},{label:"300 g",price:100,mrp:120}] },
  { id:"pc2", name:"Dove Soap",           brand:"HUL",          cat:"personal", img:"🧼", badge:"",        stock:true, variants:[{label:"75 g",price:40,mrp:45},{label:"4 bar pack",price:145,mrp:165}] },
  { id:"pc3", name:"Head & Shoulders",    brand:"P&G",          cat:"personal", img:"🧴", badge:"",        stock:true, variants:[{label:"90 ml",price:100,mrp:115},{label:"180 ml",price:185,mrp:210},{label:"340 ml",price:320,mrp:365}] },
  { id:"pc4", name:"Dettol Hand Wash",    brand:"Reckitt",      cat:"personal", img:"🧴", badge:"",        stock:true, variants:[{label:"200 ml",price:65,mrp:75},{label:"500 ml",price:145,mrp:165}] },
];

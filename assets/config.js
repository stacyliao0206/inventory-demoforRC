const CONFIG = {
  // 示範環境:固定讀取本地 demo 資料，不連接 Google Sheets
  useLiveData: false,
  demoMode: true,

  sheets: {
    skus: "",
    transactions: "",
    warehouses: "",
    audits: "",
    bom: ""
  },

  camps: [
    { name: "2026 冬令營", date: "2026-02-10", students: 1500 },
    { name: "2026 夏令營", date: "2026-07-15", students: 4000 },
    { name: "2027 冬令營", date: "2027-02-10", students: 1500 },
    { name: "2027 夏令營", date: "2027-07-15", students: 4000 }
  ],

  staleMonths: 12
};

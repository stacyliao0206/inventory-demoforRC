const CONFIG = {
  // 示範環境:固定讀取本地 demo 資料，不連接 Google Sheets
  useLiveData: true,
  demoMode: true,

  sheets: {
    skus: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbVbD0-h_g0nWhdw4zq48x5aRCZ00Ay2qL_JVaKlWBXAZ2ALo2IYFcC2oo0cDnMA/pub?gid=1692658489&single=true&output=csv",
    transactions: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbVbD0-h_g0nWhdw4zq48x5aRCZ00Ay2qL_JVaKlWBXAZ2ALo2IYFcC2oo0cDnMA/pub?gid=1880142183&single=true&output=csv",
    warehouses: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbVbD0-h_g0nWhdw4zq48x5aRCZ00Ay2qL_JVaKlWBXAZ2ALo2IYFcC2oo0cDnMA/pub?gid=167075805&single=true&output=csv",
    audits: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbVbD0-h_g0nWhdw4zq48x5aRCZ00Ay2qL_JVaKlWBXAZ2ALo2IYFcC2oo0cDnMA/pub?gid=469782246&single=true&output=csv",
    bom: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbVbD0-h_g0nWhdw4zq48x5aRCZ00Ay2qL_JVaKlWBXAZ2ALo2IYFcC2oo0cDnMA/pub?gid=849392750&single=true&output=csv"
  },

  camps: [
    { name: "2026 冬令營", date: "2026-02-10", students: 1500 },
    { name: "2026 夏令營", date: "2026-07-15", students: 4000 },
    { name: "2027 冬令營", date: "2027-02-10", students: 1500 },
    { name: "2027 夏令營", date: "2027-07-15", students: 4000 }
  ],

  staleMonths: 12
};

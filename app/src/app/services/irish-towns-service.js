import countyList from '../../assets/countrydata/irish-counties.json';

export default class IrishTownsService {
  // As per https://kuntaliitto.fi/sites/default/files/media/file/Ervat_Sairaanhoitopiirit2019.pdf
  // natural sort via http://www.davekoelle.com/files/alphanum.js
  static naturalSort(a, b) {
    for (let x = 0, aa, bb; (aa = a[x]) && (bb = b[x]); x++) {
      aa = aa.toLowerCase();
      bb = bb.toLowerCase();
      if (aa !== bb) {
        let c = Number(aa);
        let d = Number(bb);
        if (c == aa && d == bb) {
          return c - d;
        } else {
          return aa > bb ? 1 : -1;
        }
      }
      return a.length - b.length;
    }
  }

  static getCounties() {
    return countyList.counties.sort((a, b) => {
      return this.naturalSort(a.county.county_name, b.county.county_name);
    });
  }

  static getCounty(countyName) {
    return countyList.filter(a => a.county.county_name === countyName);
  }

  static getTowns(selectedCounty) {
    return selectedCounty.towns.sort((a, b) => {
      return this.naturalSort(a, b);
    }).map(town => ({
      id: town,
      name: town,
    }));
  }
}

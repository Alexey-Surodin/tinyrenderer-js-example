export class Model {
  vert = Array<Array<number>>();
  text = Array<Array<number>>();
  norm = Array<Array<number>>();
  faces = Array<Array<Array<number>>>();

  constructor(text: string) {

    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const str = line.split(/\s+/);

      if (str[0] == 'v') {
        let v = new Array<number>();
        for (let i = 1; i < str.length; i++)
          v.push(parseFloat(str[i]));
        this.vert.push(v);
      }
      else if (str[0] == 'f') {
        let face = Array<Array<number>>();

        for (let i = 1; i < str.length; i++) {
          let f_str = str[i].split('/');
          let f = Array<number>();
          for (let j = 0; j < f_str.length; j++) {
            f.push(parseInt(f_str[j]) - 1);
          }
          face.push(f);
        }
        this.faces.push(face);
      }
      else if (str[0] == 'vt') {
        let t = new Array<number>();
        for (let i = 1; i < str.length; i++){
          t.push(parseFloat(str[i]));
        }
        this.text.push(t);
      }
      else if (str[0] == 'vn') {
        let n = new Array<number>();
        for (let i = 1; i < str.length; i++){
          n.push(parseFloat(str[i]));
        }
        this.norm.push(n);
      }
    }
  }
}
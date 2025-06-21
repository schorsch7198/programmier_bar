import pHTML from './p-main.html';

export default class pMain {

  constructor(args) {
    args.target.innerHTML = pHTML; 
  }
}
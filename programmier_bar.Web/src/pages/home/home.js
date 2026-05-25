import pHTML from './home.html';

export default class pMain {

  constructor(args) {
    args.target.innerHTML = pHTML; 
  }
}
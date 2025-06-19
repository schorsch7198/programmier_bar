import PageHTML from './p-main.html';

export default class PageMain {

  constructor(args) {
    args.target.innerHTML = PageHTML; 
  }
}
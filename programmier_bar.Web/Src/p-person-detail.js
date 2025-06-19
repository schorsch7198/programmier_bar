// import bootstrap from  './../node_modules/bootstrap/dist/js/bootstrap.bundle';


import PageHTML from './p-person-detail.html';

export default class pPersonDetail{
  //======================================================================================================================================
  #args = null;
  //======================================================================================================================================
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    //------------------------------------------------------------
    const filePic = args.target.querySelector('#filePic');
    const imgPic = args.target.querySelector('#imgPic');
    const textTitlePre = args.target.querySelector('#textTitlePre');
    const textForename = args.target.querySelector('#textForename');
    const textSurname = args.target.querySelector('#textSurname');
    const textTitlePost = args.target.querySelector('#textTitlePost');
    const numberDigit = args.target.querySelector('#numberDigit');
    const textLoginName = args.target.querySelector('#textLoginName');
    const passwordPassword = args.target.querySelector('#passwordPassword');
    const buttonSave = args.target.querySelector('#buttonSave');

    this.video = document.getElementById('player');
    this.canvas = document.getElementById('canvas');
    this.capture = document.getElementById('capture-button');

    const rowAdmin = args.target.querySelector('#rowAdmin');
    const selectRole = args.target.querySelector('#selectRole');
    const textLoginLast = args.target.querySelector('#textLoginLast');

    const alertMessage = args.target.querySelector('#alertMessage');


    let person = null;


    //------------------------------------------------------------
    // events
    //------------------------------------------------------------
    imgPic.addEventListener( 'click', () => {
      filePic.click();
    });

    imgPic.addEventListener( 'dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });  

    imgPic.addEventListener( 'drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.#picRead(e.dataTransfer.files[0]);
      }
    });


    filePic.addEventListener( 'change', (e) => {
      this.#picRead(filePic.files[0]);
    });


    buttonSave.addEventListener( 'click', () => {
      // reset/hide the alert
      alertMessage.classList.remove('alert-success','alert-danger');
      alertMessage.classList.add('d-none');

      if (!person) {
        person = {
          // personId: null
        };
      }

      person.personId = person.personId ?? args.id ? parseInt(args.id) : null;

      // person.titlePre = textTitlePre.value ? textTitlePre.value : null;
      person.titlePre = textTitlePre.value || '';
      person.forename = textForename.value ? textForename.value : null;
      person.surname = textSurname.value ? textSurname.value : null;
      // person.titlePost = textTitlePost.value ? textTitlePost.value : null;
      person.titlePost = textTitlePost.value || '';
      person.digit = numberDigit.value ? parseInt(numberDigit.value) : null;
      person.loginName = textLoginName.value ? textLoginName.value   : null;
      // person.passwordPassword = passwordPassword.value || '';
      person.roleNumber = parseInt(selectRole.value);

      person.roleText = selectRole.options[selectRole.selectedIndex]?.text || '';
      // person.loginToken = person.loginToken || ''; // required but empty is fine

      if (passwordPassword.value && passwordPassword.value != '##########') person.password = passwordPassword.value;
      person.picType = person.picType || 'image/png'; // fallback if none
      // if (imgPic.dataset.pic == 'ok') person.picStr = imgPic.src;
      if (!person.picStr && imgPic.src && imgPic.src.startsWith('data:')) {
        person.picStr = imgPic.src;
        imgPic.dataset.pic = 'ok';
      }

      args.app.apiSet((r) => {
        // display the message in the bottom‐bar alert
        alertMessage.innerText = r.message;
        if (r.success) {
          person = r.person;
          alertMessage.classList.remove('d-none');
          alertMessage.classList.add('alert-success');
          setTimeout(() => alertMessage.classList.add('d-none'), 3000);
        } else {
          alertMessage.classList.remove('d-none');
          alertMessage.classList.add('alert-danger');
          setTimeout(() => alertMessage.classList.add('d-none'), 10000);
        }
      }, (ex) => {
        alertMessage.innerText = ex;
        alertMessage.classList.remove('d-none');
        alertMessage.classList.add('alert-danger');
      }, '/person', person.personId, person);

    });

    //------------------------------------------------------------
    // init
    //------------------------------------------------------------
    if (args.app.user.roleNumber == 2) {
      rowAdmin.classList.remove('d-none');
      numberDigit.readOnly = false;
    }


    if (args.id) {
      args.app.apiGet((r) => {
        person = r;

        // if (person.picStr) {
        //   imgPic.src = person.picStr;
        //   imgPic.dataset.pic = 'ok';
        // }
        if (imgPic.dataset.pic === 'ok' && imgPic.src && imgPic.src.startsWith('data:image/')) {
          person.picStr = imgPic.src;
        }
        textTitlePre.value = person.titlePre ?  person.titlePre : '';
        textForename.value = person.forename ? person.forename : '';
        textSurname.value = person.surname ? person.surname : '';
        textTitlePost.value = person.titlePost ?  person.titlePost : '';
        numberDigit.value = person.digit ? person.digit : '';
        textLoginName.value = person.loginName ? person.loginName : '';
        selectRole.value = person.roleNumber ? person.roleNumber : '0';
        textLoginLast.value = person.loginLast ? args.app.formatDate(person.loginLast) : 'never';

        if (person.passwordSet) passwordPassword.value = '##########';

      }, (ex) =>  {
        alert(ex);
      }, '/person/' + args.id);

    }
    // this.initializeMedia();


    //------------------------------------------------------------
    //------------------------------------------------------------
  } // constructor

  //======================================================================================================================================
  // private methods
  //======================================================================================================================================
  #picRead(data) {
    const imgPic = this.#args.target.querySelector('#imgPic');
    const reader = new FileReader();
    reader.onload = (r) => {
      imgPic.src = r.target.result;
    };
    reader.readAsDataURL(data);
    imgPic.dataset.pic = 'ok';
  }

  initializeMedia() {
    if (!('mediaDevices' in navigator)) {
      navigator.mediaDevices = {};
    }

    if (!('getUserMedia' in navigator.mediaDevices)) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented!'));
        }

        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false})
      .then(stream => {
        this.video.srcObject = stream;
      })
      .catch(err => {
        console.log(err.message);
      });

    this.capture.addEventListener('click', event => {
      // this.canvas.style.display = 'none';
      // canvas.getContext('2d').drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      // this.video.srcObject.getVideoTracks().forEach(track => {
      //   track.stop();
      // });

      const dataUrl = this.canvas.toDataURL();
      //this.picture = dataURItoBlob(dataUrl);
      console.log('Picture', dataUrl);

      const imgPic = this.#args.target.querySelector('#imgPic');
      imgPic.src = dataUrl;
      imgPic.dataset.pic = 'ok';
      }
    );
  }
}

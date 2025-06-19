import HTML from './p-person-list.html';

export default class pPersonList {

  constructor(args) {
    args.target.innerHTML = HTML;

    //-----------------------------------------------------------------------------
    const tablePerson = args.target.querySelector('#tablePerson>tbody');
    const registerButton = args.target.querySelector('#registerButton');

    let personList = null;

    //-----------------------------------------------------------------------------
    // events
    //-----------------------------------------------------------------------------
    tablePerson.addEventListener( 'click', (e) => {
      let btn = null;
      let tr = e.target;

      while (tr.nodeName != 'TR' && tr.parentElement) tr = tr.parentElement;
      if (e.target.nodeName == 'I' && e.target.parentElement.nodeName == 'BUTTON') btn = e.target.parentElement;
      else if (e.target.nodeName == 'BUTTON') btn = e.target;
      
      if (btn) {
        const person = personList.filter( p => p.personId == btn.dataset.id)[0];
        if (confirm('Are you sure you want to delete ' + person.surname + ' ' + person.forename + ' ?')) {
          args.app.apiDelete((r) => {
            if (r.success) tr.remove();
          }, (ex) => {
            alert(ex);
          }, '/person/' + person.personId);
        }
      } else {
        if (tr && tr.dataset.id) {
          window.open('#persondetail?id=' + tr.dataset.id, '_self');
        }
      }

    });

  registerButton.addEventListener('click', (e) => { 
    this.askForNotificationPermission();
  });
    
    //-----------------------------------------------------------------------------
    // init
    //-----------------------------------------------------------------------------
    args.app.apiGet((pl) => {
      personList = pl;
      let html = '';
      for (const p of pl) {
        html += `
          <tr data-id="${p.personId}">
            <td>
              <button type="button" class="btn btn-secondary" data-aktion="del" data-id="${p.personId}"><i class="bi-trash3"></i></button>
            </td>
            <td class="element-clickable">
              ${(p.picStr 
              ? `
                <div class="d-flex flex-row align-items-center">
                  <div>
                    <img src="${p.picStr}" style="max-width: 6rem; max-height:5rem;" title="profilepic" />
                  </div>
                  <div class="p-2">
                    ${p.surname} ${p.forename} ${p.titlePre} ${p.titlePost}
                  </div>
                </div>
              `
              : `${p.surname} ${p.forename} ${p.titlePre} ${p.titlePost}`)}
              
            </td>
            <td class="element-clickable">${p.roleText}</td>
            <td class="element-clickable">${p.loginName}</td>
            <td class="element-clickable">${(p.loginLast ? args.app.formatDate(p.loginLast) : '')}</td>
          </tr>
        `;
      }

      tablePerson.innerHTML  = html;
    }, (ex) =>  {
      alert(ex);
    }, '/person');

    //-----------------------------------------------------------------------------
    //-----------------------------------------------------------------------------
  } // constructor

  // askForNotificationPermission() {
  //   Notification.requestPermission(result => {
  //     console.log('User Choice', result);
  //     if (result !== 'granted') {
  //       console.log('No notification permission granted!');
  //     } else {
  //       //this.displayConfirmNotification();
  //       this.configurePushsubscription();
  //     }
  //   });
  // }

  // displayConfirmNotification() {
  //     //const options = { body: "Hello World!" };
  //     const options = {
  //       body: 'hello world! You successfully subscribed to our Notification service!',
  //       icon: 'images/icons/icon-96x96.png',
  //       image: 'images/icons/icon-284x284.png',
  //       dir: 'ltr',
  //       lang: 'en-US', // BCP 47
  //       vibrate: [100, 50, 200],
  //       badge: 'images/icons/icon-96x96.png',
  //       tag: 'confirm-notification',
  //       renotify: true,
  //       //only works via service worker
  //       actions: [
  //         { action: 'confirm', title: 'Okay', icon: 'images/icons/icon-96x96.png' },
  //         { action: 'cancel', title: 'Cancel', icon: 'images/icons/icon-96x96.png' }
  //       ]
  //     };

  //     if ('serviceWorker' in navigator) {
  //       navigator.serviceWorker.ready
  //         .then(sw => {
  //           sw.showNotification('Successfully subscribed!', options);
  //         });
  //     }

  //     if ("Notification" in window) {
  //       if (Notification.permission === "granted") {
  //         new Notification('Successfully subscribed!', options);
  //       } else if (Notification.permission !== "denied") {
  //         Notification.requestPermission().then(permission => {
  //           if (permission === "granted") {
  //             new Notification('Successfully subscribed!', options);
  //           }
  //         });
  //       }
  //     }
  // }
  
  // configurePushsubscription() {
  //   if (!('serviceWorker' in navigator)) {
  //     return;
  //   }
  //   var swRegistration;
  //   navigator.serviceWorker.ready
  //     .then(function(sw) {
  //       swRegistration = sw;
  //       return swRegistration.pushManager.getSubscription();
  //     })
  //     .then(function(subscription) {
  //       if (subscription === null) {
  //         //npm install web-push -g
  //         //web-push generate-vapid-keys --json

  //         var vapidPublicKey = 'BPw7nh5L8xTcDDFiC012p4vZRIpR3Mh4afWEG-J0_6WJd6TLQH8tUHSQvw95wJDyZmTd2Gq61Y7KQionB2hRz5k';
  //         var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
  //         swRegistration.pushManager.subscribe({
  //           userVisibleOnly: true,
  //           applicationServerKey: convertedVapidPublicKey
  //         }).then(function(newSubscription) {
  //           //post to backend and save subscription
            
  //           console.log(JSON.stringify(newSubscription));
  //         });
  //       } else {
  //         //use existing subscription
  //         //backend: is registration correct?
  //         console.log(JSON.stringify(subscription));
  //       }
  //     });
  
  //     function urlBase64ToUint8Array(base64String) {
  //       const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  //       const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  //       const rawData = window.atob(base64);
  //       const outputArray = new Uint8Array(rawData.length);

  //       for (let i = 0; i < rawData.length; ++i) {
  //         outputArray[i] = rawData.charCodeAt(i);
  //       }

  //       return outputArray;
  //     }
  //   }


  //===================================================================================================================================
  //===================================================================================================================================
} // class
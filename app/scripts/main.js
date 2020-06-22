/*
*
*  Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

/* eslint-env browser, es6 */

'use strict';
/* https://web-push-codelab.glitch.me */

const applicationServerPublicKey = 'BCbzLYorVB3ZbO1Vqi2yqB_r8_HgAYbfKWddzinFCllFFvaRYHx_sQ3KJL_888yT_XX2Z9KJPb-itpqsoaVUBvk';

const pushButton = document.querySelector('.js-push-btn');

let isSubscribed = false;
let swRegistration = null;

/* UInt8Array로 변환, 구글 코드랩 테스트 코드로 받음  */
function urlB64ToUint8Array(base64String) {
  console.log('urlB64ToUint8Array 키 >>>', base64String);
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/*
이 코드는 현재 브라우저에서 서비스 워커와 푸시 메시지를 지원하는지 확인하며, 
지원한다면 sw.js 파일을 등록합니다.
*/
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push 지원 중');

  navigator.serviceWorker.register('sw.js')
    .then(function (swReg) {
      console.log('Service Worker 등록이 완료 되었습니다!', swReg);

      swRegistration = swReg;
      /* 서비스 워커가 등록될 때 initialiseUI 실행, 버튼 텍스트 변경 */
      initialiseUI();
    })
    .catch(function (error) {
      console.error('Service Worker 에러', error);
    });
} else {
  console.warn('Push messaging is not supported');
  pushButton.textContent = '푸시 알림이 지원되지 않음';
}

/* 구독 상태 여부를 판단해서 버튼을 활성화하거나 비활성화함 */
function updateBtn() {
  /* 사용자가 권한 요청을 차단할 경우
    사용자가 권한을 차단하면 웹 앱이 권한 프롬프트를 다시 표시할 수 없고 사용자가 구독할 수 없게 되므로 사용자가 푸시 버튼을 사용할 수 없음
    => 버튼을 영구적으로 비활성화하는 것이 최선
  */
  if (Notification.permission === 'denied') {
    pushButton.textContent = '푸시 알림 권한 블락';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = '푸시 알림 구독 취소';
  } else {
    pushButton.textContent = '푸시 알림 구독';
  }

  pushButton.disabled = false;
}

/* 사용자가 푸시 메시지를 구독하는가 */
function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);

  /* 애플리케이션 서버의 공개 키와 userVisibleOnly: true 값을 반환 */
  swRegistration.pushManager.subscribe({
    /* userVisibleOnly는 기본적으로 푸시가 전송될 때마다 알림을 표시하도록 허용하는 것 */
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
    .then(function (subscription) {
      /* 두 가지가 완료된 것
      사용자가 알림을 표시할 권한을 허용했습니다/브라우저가 PushSubscription 생성을 위한 세부 정보를 얻기 위해 푸시 서비스로 네트워크 요청을 보냈습니다.
      */
      console.log('User is subscribed:', subscription);

      updateSubscriptionOnServer(subscription);

      isSubscribed = true;

      updateBtn();
    })
    .catch(function (err) {
      console.log('Failed to subscribe the user: ', err);
      updateBtn();
    });
}

/* 사용자의 푸시 메시지 구독 취소 */
function unsubscribeUser() {
  /*  현재 구독 가져옴, getSubscription로 확인되는 프라미스가 존재할 경우, 프라미스가 반환, 존재하지 않으면 null이 반환됨 */
  swRegistration.pushManager.getSubscription()
    .then(function (subscription) {
      if (subscription) {
        /* 구독 중인 상태이고, 구독 취소를 의도했기 때문에 구독 취소 => unsubscribe */
        return subscription.unsubscribe();
      }
    })
    .catch(function (error) {
      console.log('Error unsubscribing', error);
    })
    .then(function () {
      updateSubscriptionOnServer(null);

      console.log('사용자가 구독을 취소하였습니다.');
      isSubscribed = false;

      updateBtn();
    });
}


/* 사용자가 현재 구독 상태인지를 확인 */
function initialiseUI() {
  /* 사용자가 푸시 버튼을 클릭할 때 푸시를 구독하는 데 시간이 걸릴 수 있으니 버튼을 비활성화하여 구독하는 동안 사용자가 연속으로 버튼을 클릭할 수 없게 */
  pushButton.addEventListener('click', function () {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });
  /* getSubscription() 구독이 있는 경우 
  현재 구독으로 확인되는 프라미스를 반환하고 
  그렇지 않으면 null을 반환하는 메서드 */
  swRegistration.pushManager.getSubscription()
    .then(function (subscription) {
      isSubscribed = !(subscription === null);
      if (isSubscribed) {
        console.log('해당 사용자는 구독 중입니다.');
      } else {
        console.log('해당 사용자는 구독 상태가 아닙니다');
      }

      updateBtn();
    });
}

/* 실제 앱에서 백으로 구독을 보내는 메시지, 아래 정보가 있어야 푸시를 보낼 수 있음 */
function updateSubscriptionOnServer(subscription) {
  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails =
    document.querySelector('.js-subscription-details');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-invisible');
  }
}

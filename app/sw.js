'use strict';


/* 1. 트리거 시 보여질 알림 설정 */
/*
self.addEventListener('push', ...);
서비스 워커에 이벤트 리스너(아래의 코드)를 추가하여 
서비스 워커에서 발생하는 푸시 이벤트를 수신할 수 있도록 합니다.

self = 서비스 워커 자체를 참고, 서비스 워커에 이벤트 리스너 추가

푸시 메시지 수신 -> 이벤트 리스너 실행 -> 등록 -> showNonfiction() 호출 -> 알림 생성

showNonfiction()은 title과 option 객체를 넘겨받을 수 있습니다
option =>  본문 메시지, 아이콘 및 배지 설정 가능

event.waitUntil()
프라미스를 취하며 브라우저는 전달된 프라미스가 확인될 때까지 서비스 워커를 활성화 및
실행 상태로 유지할 것
*/
self.addEventListener('push', function (event) {
    console.log('[Service Worker] 푸시 알림 도착');
    console.log(`[Service Worker] 푸시 알림에서 보낸 메시지: "${event.data.text()}"`);

    var message = JSON.parse(event.data.text());

    console.log('받은 메시지 JSON 변환 완료 >', message);
    const title = message.title;
    const options = {
        body: message.body,
        icon: message.icon,
        badge: 'images/badge.png',
        data: message.data,
        direct: message.direct,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

/*
아래 코드로 대체 가능

const notificationPromise = self.registration.showNotification(title, options);
event.waitUntil(notificationPromise);
*/



/* 2. 알림 클릭 시 발생될 일 정의 */
/* notificationclick 리스너 추가 */
/**
 * 사용자가 알림 클릭 -> 클릭한 알림 닫기 -> notificationclick 이벤트 리스너 호출 -> waitUntil 활용하여 지정해 준 브라우저가 표시되기 전에는 브라우저가 서비스 워커를 종료하지 못하도록 설정 
 * 
 */
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.', event.notification);
    event.notification.close();

    /* https://www.youtube.com/watch?v=KO7S0JCec7Q */
    /* https://www.youtube.com/watch?v=g8BV0rvbmOc */
    /* https://www.youtube.com/watch?v=03Sdc8qMcbA */


    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});

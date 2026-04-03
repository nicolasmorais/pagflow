self.addEventListener('push', function (event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/apple-icon.png',
        badge: '/apple-icon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/admin/vendas'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

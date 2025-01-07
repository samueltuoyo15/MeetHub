interface PushEvent extends Event {
  data: {
    json(): { title: string; body: string };
  };
}

interface NotificationEvent extends Event {
  action: string;
  notification: Notification;
}

declare const clients: {
  openWindow(url: string): Promise<void>;
};

declare const self: ServiceWorkerGlobalScope;

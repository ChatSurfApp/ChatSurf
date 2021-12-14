module.exports = class Message {
  constructor(io, socket, message) {
    this.io = io;
    this.author = socket;
    this.content = message;
    this.subs = {};
  }

  cancel() {
    if (this.subs.cancel) {
      this.subs.cancel();
    }
  }

  reply(message) {
    this.author.emit("new_message", {
      author: {
        username: "Server",
        badge: "dns"
      },
      content: message
    });
  }

  to(socket) {
    return {
      send: async message => {
        var to = socket;

        if (typeof to === "string") {
          to = (await this.io.fetchSockets()).find(
            s => s.username.toLowerCase() === to.toLowerCase()
          );

          if (!to) {
            throw new Error("user not found");
          }
        }

        to.emit("new_message", {
          author: {
            username: "Server",
            badge: "dns"
          },
          content: message
        });
      },
      socket: async () => {
        var to = socket;

        if (typeof to === "string") {
          to = (await this.io.fetchSockets()).find(
            s => s.username.toLowerCase() === to.toLowerCase()
          );

          if (!to) {
            throw new Error("user not found");
          }
        }

        return to;
      }
    };
  }
};

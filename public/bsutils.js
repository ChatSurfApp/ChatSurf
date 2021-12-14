function makeModal(opt) {
  return `
  <div class="modal fade" tabindex="-1">
  <div class="modal-dialog modal-dialog-scrollable${opt.fullscreen ? " modal-fullscreen" : ""}">
    <div class="modal-content bg-light">
      <div class="modal-header">
        <h5 class="modal-title">${opt.header}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <p>${opt.body}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
  `;
}

function makeMsg(opt) {
  function parseMessage(message) {
    var parsed = message;
    parsed = discordMarkdown.toHTML(parsed);
    parsed = parsed.replace(/:([A-Za-z_]+?):/g, function(x) {
      var findRes = emojiList.find(
        emojiObj => emojiObj.shortname.toLowerCase() === x.toLowerCase()
      );

      if (!findRes) return x;
      else return findRes.emoji;
    });
    parsed = twemoji.parse(parsed, {
      base: "https://github.com/twitter/twemoji/raw/master/assets/"
    });
    return parsed;
  }
  
  var badge = opt.badge ? ` <span class="badge rounded-pill bg-primary mx-1 fs-6 material-icons">${opt.badge}</span>` : ""

  return `
  <div id="msg-${opt.id}">
    <div class="fw-bold text-primary d-flex align-items-center">
      ${opt.username + badge} - ${moment().format("ddd Do MMM [at] h:mmA")}
    </div>
    <div>
      ${parseMessage(opt.message)}
    </div>
  </div>
  `;
}


function clearDomElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}


class _PlayerListRenderer {
  constructor(domTarget) {
    this.domTarget = domTarget;
  }
  
  render(players) {
    clearDomElement(this.domTarget);
    players.forEach(player => {
      this.renderPlayer(player);
    });
  }

  renderPlayer(player) {
    const element = document.createElement('div');
    element.classList.add('player');

    const color = document.createElement('div');
    color.classList.add('color-indicator');
    color.setAttribute('style', `background-color: ${player.color}`);
    element.appendChild(color);

    const name = document.createElement('p');
    name.classList.add('player-name');
    name.innerHTML = player.name;
    element.appendChild(name);

    const life = document.createElement('p');
    life.classList.add('player-life');
    const hearts = new Array(player.energy).fill('&#10084;');
    life.innerHTML = hearts.join('');
    element.appendChild(life);

    this.domTarget.appendChild(element);
  }
}

window.PlayerListRenderer = _PlayerListRenderer;


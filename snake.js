const _ = document;

class Box {
   constructor(grid, x, y, color = 'var(--blue)') {
      this.x = x;
      this.y = y;
      this.grid = grid;
      this.elem = this.initElement(color);
   }

   initElement(color) {
      const elem = _.createElement('div');
      elem.style.gridColumn = this.x;
      elem.style.gridRow = this.y;
      elem.style.backgroundColor = color;
      this.grid.appendChild(elem);
      return elem;
   }

   setPos(x, y) {
      this.x = x;
      this.y = y;
      this.elem.style.gridColumn = this.x;
      this.elem.style.gridRow = this.y;
   }
}

class Game {
   constructor(grid, menu) {
      this.grid = grid;
      this.menu = menu;
      this.size = 31;
      this.direction = 'down';
      this.snake = [];
      this.pickup = null;
      this.speed = 80;
      this.pendingAdd = 0;
      this.loopInterval = null;
      this.score = 0;

      this.initBtns();
   }

   start() {
      this.setScore(0);
      this.initStyle();
      this.initSnake(3);
      this.newPickup();
      this.direction = 'down';
      this.loopInterval = setInterval(() => this.loop(), this.speed);
      _.addEventListener('keydown', e => this.handleKeyDown(e));
      this.menu.style.display = 'none';
   }

   kill() {
      clearInterval(this.loopInterval);
      this.grid.removeChild(this.pickup.elem);
      this.pickup = null;
      this.snake.forEach(({ elem }) => this.grid.removeChild(elem));
      this.snake = [];
      _.getElementById('btn-start').innerText = 'Retry';
      _.getElementById('old-score').innerHTML = `Previous Score: ${this.score}`;
      this.menu.style.display = 'flex';
      this.setScore(0);
   }

   initStyle() {
      this.grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
      this.grid.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
   }

   initBtns() {
      _.getElementById('btn-start').addEventListener('click', () => {
         this.start();
      });
      const speedBtns = [..._.getElementById('speeds').children];
      speedBtns.forEach((e, i) =>
         e.addEventListener('click', () => this.setSpeed(i, speedBtns))
      );
      const sizeBtns = [..._.getElementById('sizes').children];
      sizeBtns.forEach((e, i) =>
         e.addEventListener('click', () => this.setSize(i, sizeBtns))
      );
   }

   newPickup() {
      if (this.pickup) this.grid.removeChild(this.pickup.elem);
      this.pickup = new Box(
         this.grid,
         Math.floor(Math.random() * this.size) + 1,
         Math.floor(Math.random() * this.size) + 1,
         'var(--pink)'
      );
      // just to make sure our new pickup isn't on our snake body
      for (const part of this.snake) {
         if (this.pickup.x === part.x && this.pickup.y === part.y) {
            this.newPickup();
            break;
         }
      }
   }

   initSnake(length) {
      for (let i = 0; i < length; i++) {
         this.snake.push(
            new Box(
               this.grid,
               Math.ceil(this.size / 2),
               Math.ceil(this.size / 2) - i
            )
         );
      }
   }

   appendSnake(x, y) {
      this.snake.push(new Box(this.grid, x, y));
   }

   setScore(score) {
      this.score = score;
      document.getElementById('score').innerText = `Score: ${this.score}`;
   }

   setSize(b, btns) {
      const sizes = [21, 31, 41];
      this.size = sizes[b];
      btns.forEach((e, i) => (e.className = `btn ${b === i && 'selected'}`));
   }

   setSpeed(b, btns) {
      const speeds = [100, 80, 40];
      this.speed = speeds[b];
      btns.forEach((e, i) => (e.className = `btn ${b === i && 'selected'}`));
   }

   checkCollisions() {
      const [hd, ...tail] = this.snake;
      // check walls
      if (hd.x < 1 || hd.y < 1 || hd.x > this.size || hd.y > this.size)
         return false;
      // check the rest of the body
      for (const part of tail) {
         if (hd.x === part.x && hd.y === part.y) return false;
      }
      // check if we are about to pickup
      if (hd.x === this.pickup.x && hd.y === this.pickup.y) {
         this.pendingAdd++;
         this.newPickup();
         const scores = {
            100: 10,
            80: 15,
            40: 20
         };
         this.setScore(this.score + scores[this.speed]);
      }
      return true;
   }

   handleKeyDown(e) {
      switch (e.keyCode) {
         case 37:
            if (this.direction !== 'right') this.direction = 'left';
            break;
         case 38:
            if (this.direction !== 'down') this.direction = 'up';
            break;
         case 39:
            if (this.direction !== 'left') this.direction = 'right';
            break;
         case 40:
            if (this.direction !== 'up') this.direction = 'down';
            break;
         default:
            break;
      }
   }

   loop() {
      if (this.direction) {
         const moves = {
            up: i => i.setPos(i.x, i.y - 1),
            down: i => i.setPos(i.x, i.y + 1),
            left: i => i.setPos(i.x - 1, i.y),
            right: i => i.setPos(i.x + 1, i.y)
         };
         // If we have a pending pickup, add to our snake
         if (this.pendingAdd) {
            const tail = this.snake[this.snake.length - 1];
            this.appendSnake(tail.x, tail.y);
            this.pendingAdd--;
         }
         // If the player somehow wins
         if (this.snake.length === this.size * this.size) {
            this.menu.innerHTML = `<h1>You Win!</h1><h2>Score: ${
               this.score
            }</h2>`;
            this.kill();
            return;
         }
         // Traverse backwards through the snake, each box following one-another
         for (let i = this.snake.length - 1; i > 0; i--) {
            const { x, y } = this.snake[i - 1];
            this.snake[i].setPos(x, y);
         }
         // Move our head
         moves[this.direction](this.snake[0]);
         // Check collisions
         !this.checkCollisions() && this.kill();
      }
   }
}

window.onload = () => {
   // I don't like using the window scoped variable for id's
   new Game(_.getElementById('grid'), _.getElementById('menu'));
};

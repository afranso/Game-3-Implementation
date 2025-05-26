class mainGame extends Phaser.Scene {
    constructor() {
        super("mainGame");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 300;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1000;
        this.JUMP_VELOCITY = -300;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.spritesheet('tilemap_frames', 'monochrome_tilemap_transparent_packed.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.image("tilemap_tiles", "monochrome_tilemap_transparent_packed.png");
        this.load.tilemapTiledJSON("platformer-level", "platformer-level.tmj");
        this.load.image("player-character", "tile_0240.png");
        this.load.image("particle1", "tile_0020.png");
        this.load.image("particle2", "tile_0021.png");
        this.load.image("particle3", "tile_0022.png");
        this.load.audio("jsound", "highUp.ogg");
        this.load.audio("csound", "phaserUp7.ogg");
        this.load.audio("wsound", "lowRandom.ogg")
    }

    create() {
        // Map loading
        this.map = this.make.tilemap({ key: "platformer-level" });
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_transparent_packed", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        my.sprite.player = this.physics.add.sprite(game.config.width/16, game.config.height/17, "player-character")
        my.sprite.player.setCollideWorldBounds(false);
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Collectible Coins
        my.vfx.coinCollect = this.add.particles(0, 0, 'particle3', {
                scale: { start: 1, end: 1 },
                lifespan: 350,
                alpha: { start: 1, end: 0.1 },
                gravityY: -300
                //maxAliveParticles: 1,
        });
        my.vfx.coinCollect.stop();
        this.coins = this.map.createFromObjects("Objects", {
            name: "Coin",
            key: "tilemap_frames",
            frame: 2
        });
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinGroup = this.add.group(this.coins);
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            const coinX = obj2.x;
            const coinY = obj2.y;
            obj2.destroy();
            my.vfx.coinCollect.emitParticleAt(coinX, coinY);
            coins_collected += 1;
            console.log(coins_collected);
            this.sound.play("csound", {
                volume: 0.1
            });
        });

        // Animations
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('tilemap_frames', {
                start: 241,
                end: 244
            }),
            frameRate: 9    ,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('tilemap_frames', {
                start: 240,
                end: 240
            }),
            repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('tilemap_frames', {
                start: 245,
                end: 245
            }),
            repeat: -1
        });
        my.vfx.walking = [
            this.add.particles(0, 0, 'particle1', {
                scale: { start: 0.5, end: 1 },
                lifespan: 350,
                alpha: { start: 1, end: 0.1 },
                gravityY: -100,
                maxAliveParticles: 1,
                frequency: 100
        }),
            this.add.particles(0, 0, 'particle2', {
                scale: { start: 0.5, end: 1 },
                lifespan: 350,
                alpha: { start: 1, end: 0.1 },
                gravity: -100,
                maxAliveParticles: 1,
                frequency: 200
        })
        ];
        my.sfx = this.sound.add("wsound", {
            volume: 0.1,
            loop: true,
            rate: 1.5
        });
        my.sfx.stop();
        my.vfx.walking.forEach(emitter => emitter.stop());

        
        // For appropriate world bounds
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        my.sprite.player.setMaxVelocity(110, 1000);

        // Camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(4);

        cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if(coins_collected >= coins_needed) {
            coins_collected += 1;
        }
        if(coins_collected === 100) {
            coins_collected = 0;
            this.scene.restart();
        }

        if(cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            my.sprite.player.resetFlip();
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            my.vfx.walking.forEach(emitter => emitter.startFollow(my.sprite.player, 5, 5));
            my.vfx.walking.forEach(emitter => emitter.setParticleSpeed(10, 10));
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.forEach(emitter => emitter.start());
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            my.sprite.player.resetFlip();   
            my.sprite.player.anims.play('walk', true);

            my.vfx.walking.forEach(emitter => emitter.startFollow(my.sprite.player, 5, 5));
            my.vfx.walking.forEach(emitter => emitter.setParticleSpeed(-10, -10));
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.forEach(emitter => emitter.start());
            }

        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
            my.vfx.walking.forEach(emitter => emitter.stop());
            my.sfx.stop();
        }

        if(Phaser.Input.Keyboard.JustDown(cursors.right)) {
            my.sfx.stop();
            my.sfx.play();
        } else if(Phaser.Input.Keyboard.JustDown(cursors.left)) {
            my.sfx.stop();
            my.sfx.play();
        }

        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("jsound", {
                volume: 0.1
            });
        }

        if (
        my.sprite.player.y > this.map.heightInPixels || // fell below map
        my.sprite.player.x < 0 ||                       // off left
        my.sprite.player.x > this.map.widthInPixels     // off right
        ) {
            my.sprite.player.setVelocity(0, 0);
            my.sprite.player.setX(game.config.width/16);
            my.sprite.player.setY(game.config.height/17);
        }

    }
}
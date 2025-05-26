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
        //this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    create() {
        // Map loading
        this.map = this.make.tilemap({ key: "platformer-level" });
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_transparent_packed", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.frontLayer = this.map.createLayer("Front", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        //this.animatedTiles.init(this.map);

        my.sprite.player = this.physics.add.sprite(game.config.width/16, game.config.height/17, "player-character")//.setScale(4.0);
        my.sprite.player.setCollideWorldBounds(false);
        this.physics.add.collider(my.sprite.player, this.groundLayer);

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
        if(cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            my.sprite.player.resetFlip();
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            my.sprite.player.resetFlip();   
            my.sprite.player.anims.play('walk', true);

        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
        }

        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

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
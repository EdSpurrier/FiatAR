function checkCameraStatus() {
    if (cameraAvailable) {
        var videoSelector = {
            video: !0
        };
        if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
            var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
            20 > chromeVersion && (videoSelector = "video");
        }
        navigator.getUserMedia(videoSelector, function(stream) {
            videoInput.mozCaptureStream ? videoInput.mozSrcObject = stream : videoInput.src = window.URL && window.URL.createObjectURL(stream) || stream, 
            videoInput.play(), cameraActive = !0, startMotionTracking(), siteCore.apps.viewAnimations.animateInstructionsUpdate("#move-left");
        }, function() {
            siteCore.apps.viewAnimations.animateInstructionsUpdate("#how-to-play-keyboard");
        });
    }
}

function startMotionTracking() {
    positionLoop();
}

function positionLoop() {
    if (motionTrackingActive) if (currentFrame == debounce) {
        var getTrack = ctracker.track(videoInput);
        getTrack ? (siteCore.apps.debugConsole.debugValue("motion-controller-input", getTrack[33][0]), 
        $motionLine.css({
            left: 150 - getTrack[33][0]
        }), getTrack[33][0] > centerRight ? (motionControllerOutputValue = (getTrack[33][0] - 90) / 60, 
        keyDown || (keyLeft = !0, keyRight = !1), siteCore.apps.debugConsole.debugValue("input-direction", "LEFT"), 
        $right.css({
            opacity: .5
        }), $center.css({
            opacity: .5
        }), $left.css({
            opacity: .75
        }), siteCore.apps.viewAnimations.instructionsTester("left")) : getTrack[33][0] < centerLeft ? (siteCore.apps.debugConsole.debugValue("input-direction", "RIGHT"), 
        motionControllerOutputValue = (60 - getTrack[33][0]) / 60, keyDown || (keyLeft = !1, 
        keyRight = !0), $right.css({
            opacity: .75
        }), $center.css({
            opacity: .5
        }), $left.css({
            opacity: .5
        }), siteCore.apps.viewAnimations.instructionsTester("right")) : (siteCore.apps.debugConsole.debugValue("input-direction", "UP"), 
        $right.css({
            opacity: .5
        }), $center.css({
            opacity: .75
        }), $left.css({
            opacity: .5
        }), motionControllerOutputValue = 0, siteCore.apps.debugConsole.debugValue("game-paused", playerInput), 
        keyDown || (keyFaster = !0, keyLeft = !1, keyRight = !1), siteCore.apps.viewAnimations.instructionsTester("up")), 
        siteCore.apps.debugConsole.debugValue("motion-controller-output", motionControllerOutputValue)) : (siteCore.apps.debugConsole.debugValue("input-direction", "NO DATA"), 
        $right.css({
            opacity: .5
        }), $center.css({
            opacity: .75
        }), $left.css({
            opacity: .5
        })), currentFrame = 0;
    } else currentFrame++;
    requestAnimationFrame(positionLoop);
}

function update(dt) {
    if (playerInput) {
        var n, car, carW, playerSegment = findSegment(position + playerZ), playerW = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE, speedPercent = speed / maxSpeed, dx = 2 * dt * speedPercent;
        turnSpeed = keyDown ? dx : 2 * dt * speedPercent * (2 * motionControllerOutputValue);
        var startPosition = position;
        for (siteCore.apps.debugConsole.debugValue("speed", speed), siteCore.apps.debugConsole.debugValue("speed-percent", speedPercent), 
        siteCore.apps.debugConsole.debugValue("dt-parameter", dt), siteCore.apps.debugConsole.debugValue("dx-parameter", dx), 
        siteCore.apps.debugConsole.debugValue("turn-speed", turnSpeed), updateCars(dt, playerSegment, playerW), 
        position = Util.increase(position, dt * speed, trackLength), keyLeft ? playerX -= turnSpeed : keyRight && (playerX += turnSpeed), 
        playerX -= dx * speedPercent * playerSegment.curve * centrifugal, speed = keyFaster ? Util.accelerate(speed, accel, dt) : keySlower ? Util.accelerate(speed, breaking, dt) : Util.accelerate(speed, decel, dt), 
        siteCore.apps.debugConsole.debugValue("dx-parameter", dx), siteCore.apps.debugConsole.debugValue("player-x", playerX), 
        -1 > playerX ? (playerX = -1, speed > offRoadMinSpeed && (speed = Util.accelerate(speed, offRoadDecel, dt))) : playerX > 1 && (playerX = 1, 
        speed > offRoadMinSpeed && (speed = Util.accelerate(speed, offRoadDecel, dt))), 
        siteCore.apps.debugConsole.debugValue("player-x-after-adjustment", playerX), n = 0; n < playerSegment.cars.length; n++) if (car = playerSegment.cars[n], 
        carW = car.sprite.w * SPRITES.SCALE, speed > car.speed && Util.overlap(playerX, playerW, car.offset, carW, .8)) {
            speed = car.speed * (car.speed / speed), position = Util.increase(car.z, -playerZ, trackLength);
            break;
        }
        playerX = Util.limit(playerX, -3, 3), speed = Util.limit(speed, 0, maxSpeed), skyOffset = Util.increase(skyOffset, skySpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1), 
        hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1), 
        treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1), 
        position > playerZ && (currentLapTime && playerZ > startPosition ? (lastLapTime = currentLapTime, 
        currentLapTime = 0, lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time) ? (Dom.storage.fast_lap_time = lastLapTime, 
        updateHud("fast_lap_time", formatTime(lastLapTime)), Dom.addClassName("fast_lap_time", "fastest"), 
        Dom.addClassName("last_lap_time", "fastest")) : (Dom.removeClassName("fast_lap_time", "fastest"), 
        Dom.removeClassName("last_lap_time", "fastest")), updateHud("last_lap_time", formatTime(lastLapTime)), 
        Dom.show("last_lap_time")) : currentLapTime += dt), updateHud("speed", 5 * Math.round(speed / 500)), 
        updateHud("current_lap_time", formatTime(currentLapTime));
    }
}

function updateCars(dt, playerSegment, playerW) {
    var n, car, oldSegment, newSegment;
    for (n = 0; n < cars.length; n++) car = cars[n], oldSegment = findSegment(car.z), 
    car.offset = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW), 
    car.z = Util.increase(car.z, dt * car.speed, trackLength), car.percent = Util.percentRemaining(car.z, segmentLength), 
    newSegment = findSegment(car.z), oldSegment != newSegment && (index = oldSegment.cars.indexOf(car), 
    oldSegment.cars.splice(index, 1), newSegment.cars.push(car));
}

function updateCarOffset(car, carSegment, playerSegment, playerW) {
    var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;
    if (carSegment.index - playerSegment.index > drawDistance) return 0;
    for (i = 1; lookahead > i; i++) {
        if (segment = segments[(carSegment.index + i) % segments.length], segment === playerSegment && car.speed > speed && Util.overlap(playerX, playerW, car.offset, carW, 1.2)) return dir = playerX > .5 ? -1 : -.5 > playerX ? 1 : car.offset > playerX ? 1 : -1, 
        1 * dir / i * (car.speed - speed) / maxSpeed;
        for (j = 0; j < segment.cars.length; j++) if (otherCar = segment.cars[j], otherCarW = otherCar.sprite.w * SPRITES.SCALE, 
        car.speed > otherCar.speed && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) return dir = otherCar.offset > .5 ? -1 : otherCar.offset < -.5 ? 1 : car.offset > otherCar.offset ? 1 : -1, 
        1 * dir / i * (car.speed - otherCar.speed) / maxSpeed;
    }
    return car.offset < -.9 ? .1 : car.offset > .9 ? -.1 : 0;
}

function updateHud(key, value) {
    hud[key].value !== value && (hud[key].value = value, Dom.set(hud[key].dom, value));
}

function formatTime(dt) {
    var minutes = Math.floor(dt / 60), seconds = Math.floor(dt - 60 * minutes), tenths = Math.floor(10 * (dt - Math.floor(dt)));
    return minutes > 0 ? minutes + "." + (10 > seconds ? "0" : "") + seconds + "." + tenths : seconds + "." + tenths;
}

function render() {
    if (!gamePaused) {
        var baseSegment = findSegment(position), basePercent = Util.percentRemaining(position, segmentLength), playerSegment = findSegment(position + playerZ), playerPercent = Util.percentRemaining(position + playerZ, segmentLength), playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent), maxy = height;
        debug && (siteCore.apps.debugConsole.debugValue("current-segment", position / segmentLength), 
        siteCore.apps.debugConsole.debugValue("current-position", position));
        var x = 0, dx = -(baseSegment.curve * basePercent);
        ctx.clearRect(0, 0, width, height), Render.background(ctx, background, width, height, BACKGROUND.SKY, skyOffset, resolution * skySpeed * playerY), 
        Render.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY), 
        Render.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);
        var n, i, segment, car, sprite, spriteScale, spriteX, spriteY;
        for (n = 0; drawDistance > n; n++) segment = segments[(baseSegment.index + n) % segments.length], 
        segment.looped = segment.index < baseSegment.index, segment.fog = Util.exponentialFog(n / drawDistance, fogDensity), 
        segment.clip = maxy, Util.project(segment.p1, playerX * roadWidth - x, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth), 
        Util.project(segment.p2, playerX * roadWidth - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth), 
        x += dx, dx += segment.curve, segment.p1.camera.z <= cameraDepth || segment.p2.screen.y >= segment.p1.screen.y || segment.p2.screen.y >= maxy || (Render.segment(ctx, width, lanes, segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w, segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w, segment.fog, segment.color), 
        maxy = segment.p1.screen.y);
        for (n = drawDistance - 1; n > 0; n--) {
            for (segment = segments[(baseSegment.index + n) % segments.length], i = 0; i < segment.cars.length; i++) car = segment.cars[i], 
            sprite = car.sprite, spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent), 
            spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + spriteScale * car.offset * roadWidth * width / 2, 
            spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent), 
            Render.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -.5, -1, segment.clip);
            for (i = 0; i < segment.sprites.length; i++) sprite = segment.sprites[i], spriteScale = segment.p1.screen.scale, 
            spriteX = segment.p1.screen.x + spriteScale * sprite.offset * roadWidth * width / 2, 
            spriteY = segment.p1.screen.y, Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, sprite.offset < 0 ? -1 : 0, -1, segment.clip);
            segment == playerSegment && Render.player(ctx, width, height, resolution, roadWidth, sprites, speed / maxSpeed, cameraDepth / playerZ, width / 2, height / 2 - cameraDepth / playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height / 2, speed * (keyLeft ? -1 : keyRight ? 1 : 0), playerSegment.p2.world.y - playerSegment.p1.world.y);
        }
    }
}

function findSegment(z) {
    return segments[Math.floor(z / segmentLength) % segments.length];
}

function lastY() {
    return 0 == segments.length ? 0 : segments[segments.length - 1].p2.world.y;
}

function addSegment(curve, y) {
    var n = segments.length;
    segments.push({
        index: n,
        p1: {
            world: {
                y: lastY(),
                z: n * segmentLength
            },
            camera: {},
            screen: {}
        },
        p2: {
            world: {
                y: y,
                z: (n + 1) * segmentLength
            },
            camera: {},
            screen: {}
        },
        curve: curve,
        sprites: [],
        cars: [],
        color: Math.floor(n / rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT
    });
}

function addSprite(n, sprite, offset) {
    segments[n].sprites.push({
        source: sprite,
        offset: offset
    });
}

function addRoad(enter, hold, leave, curve, y) {
    var n, startY = lastY(), endY = startY + Util.toInt(y, 0) * segmentLength, total = enter + hold + leave;
    for (n = 0; enter > n; n++) addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
    for (n = 0; hold > n; n++) addSegment(curve, Util.easeInOut(startY, endY, (enter + n) / total));
    for (n = 0; leave > n; n++) addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
}

function addStraight(num) {
    num = num || ROAD.LENGTH.MEDIUM, addRoad(num, num, num, 0, 0);
}

function addHill(num, height) {
    num = num || ROAD.LENGTH.MEDIUM, height = height || ROAD.HILL.MEDIUM, addRoad(num, num, num, 0, height);
}

function addCurve(num, curve, height) {
    num = num || ROAD.LENGTH.MEDIUM, curve = curve || ROAD.CURVE.MEDIUM, height = height || ROAD.HILL.NONE, 
    addRoad(num, num, num, curve, height);
}

function addLowRollingHills(num, height) {
    num = num || ROAD.LENGTH.SHORT, height = height || ROAD.HILL.LOW, addRoad(num, num, num, 0, height / 2), 
    addRoad(num, num, num, 0, -height), addRoad(num, num, num, ROAD.CURVE.EASY, height), 
    addRoad(num, num, num, 0, 0), addRoad(num, num, num, -ROAD.CURVE.EASY, height / 2), 
    addRoad(num, num, num, 0, 0);
}

function addSCurves() {
    addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.NONE), 
    addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM), 
    addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.EASY, -ROAD.HILL.LOW), 
    addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.MEDIUM), 
    addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
}

function addBumps() {
    addRoad(10, 10, 10, 0, 5), addRoad(10, 10, 10, 0, -2), addRoad(10, 10, 10, 0, -5), 
    addRoad(10, 10, 10, 0, 8), addRoad(10, 10, 10, 0, 5), addRoad(10, 10, 10, 0, -7), 
    addRoad(10, 10, 10, 0, 5), addRoad(10, 10, 10, 0, -2);
}

function addDownhillToEnd(num) {
    num = num || 200, addRoad(num, num, num, -ROAD.CURVE.EASY, -lastY() / segmentLength);
}

function resetRoad() {
    segments = [], addStraight(ROAD.LENGTH.SHORT), addLowRollingHills(), addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE), 
    addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH), addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW), 
    addBumps(), addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM), addStraight(), addSCurves(), 
    addDownhillToEnd(), resetSprites(), resetCars(), segments[findSegment(playerZ).index + 2].color = COLORS.START, 
    segments[findSegment(playerZ).index + 3].color = COLORS.START;
    for (var n = 0; rumbleLength > n; n++) segments[segments.length - 1 - n].color = COLORS.FINISH;
    trackLength = segments.length * segmentLength;
}

function resetSprites() {
    var n, i;
    for (addSprite(20, SPRITES.BILLBOARD07, -1), addSprite(40, SPRITES.BILLBOARD06, -1), 
    addSprite(60, SPRITES.BILLBOARD08, -1), addSprite(80, SPRITES.BILLBOARD09, -1), 
    addSprite(100, SPRITES.BILLBOARD01, -1), addSprite(120, SPRITES.BILLBOARD02, -1), 
    addSprite(140, SPRITES.BILLBOARD03, -1), addSprite(160, SPRITES.BILLBOARD04, -1), 
    addSprite(180, SPRITES.BILLBOARD05, -1), addSprite(240, SPRITES.BILLBOARD07, -1.2), 
    addSprite(240, SPRITES.BILLBOARD06, 1.2), addSprite(segments.length - 25, SPRITES.BILLBOARD07, -1.2), 
    addSprite(segments.length - 25, SPRITES.BILLBOARD06, 1.2), n = 10; 200 > n; n += 4 + Math.floor(n / 100)) addSprite(n, SPRITES.PALM_TREE, .5 + .5 * Math.random()), 
    addSprite(n, SPRITES.PALM_TREE, 1 + 2 * Math.random());
    for (n = 250; 1e3 > n; n += 5) addSprite(n, SPRITES.COLUMN, 1.1), addSprite(n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - 2 * Math.random()), 
    addSprite(n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - 2 * Math.random());
    for (n = 200; n < segments.length; n += 3) addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([ 1, -1 ]) * (2 + 5 * Math.random()));
    var side, sprite, offset;
    for (n = 1e3; n < segments.length - 50; n += 100) for (side = Util.randomChoice([ 1, -1 ]), 
    addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side), 
    i = 0; 20 > i; i++) sprite = Util.randomChoice(SPRITES.PLANTS), offset = side * (1.5 + Math.random()), 
    addSprite(n + Util.randomInt(0, 50), sprite, offset);
}

function resetCars() {
    cars = [];
    for (var n, car, segment, offset, z, sprite, speed, n = 0; totalCars > n; n++) offset = Math.random() * Util.randomChoice([ -.8, .8 ]), 
    z = Math.floor(Math.random() * segments.length) * segmentLength, sprite = Util.randomChoice(SPRITES.CARS), 
    speed = maxSpeed / 4 + Math.random() * maxSpeed / (sprite == SPRITES.SEMI ? 4 : 2), 
    car = {
        offset: offset,
        z: z,
        sprite: sprite,
        speed: speed
    }, segment = findSegment(car.z), segment.cars.push(car), cars.push(car);
}

function reset(options) {
    options = options || {}, canvas.width = width = Util.toInt(options.width, width), 
    canvas.height = height = Util.toInt(options.height, height), lanes = Util.toInt(options.lanes, lanes), 
    roadWidth = Util.toInt(options.roadWidth, roadWidth), cameraHeight = Util.toInt(options.cameraHeight, cameraHeight), 
    drawDistance = Util.toInt(options.drawDistance, drawDistance), fogDensity = Util.toInt(options.fogDensity, fogDensity), 
    fieldOfView = Util.toInt(options.fieldOfView, fieldOfView), segmentLength = Util.toInt(options.segmentLength, segmentLength), 
    rumbleLength = Util.toInt(options.rumbleLength, rumbleLength), cameraDepth = 1 / Math.tan(fieldOfView / 2 * Math.PI / 180), 
    playerZ = cameraHeight * cameraDepth, resolution = height / 480, (0 == segments.length || options.segmentLength || options.rumbleLength) && resetRoad();
}

function playerInputStatus($state) {
    playerInput = !!$state;
}

function resetPlayerPosition() {
    speed = 0, position = 0, playerX = 0;
}

function pauseGame($status) {
    gamePaused = $status, motionTrackingActive = !$status;
}

function bug($data) {}

function siteCoreInit() {
    var everythingLoaded = setInterval(function() {
        /loaded|complete/.test(document.readyState) && (clearInterval(everythingLoaded), 
        siteCore.apps.viewAnimations = new viewAnimations(), siteCore.apps.mastheadUX = new mastheadUX());
    }, 10);
}

function debugConsole() {
    var $el = {}, consoleLine = 0, log = function($content) {
        debug && console.log("debug console: " + $content);
    }, init = function() {
        log("init()"), buildConsole(), cacheEl(), createValue("game-paused"), createValue("key-down"), 
        createValue("frames"), createValue("segments"), createValue("current-segment"), 
        createValue("current-position"), createValue("motion-controller-input"), createValue("input-direction"), 
        createValue("speed"), createValue("speed-percent"), createValue("dt-parameter"), 
        createValue("dx-parameter"), createValue("motion-controller-output"), createValue("player-x"), 
        createValue("player-x-after-adjustment"), createValue("turn-speed"), styleConsole(), 
        debugConsole("init"), document.onkeypress = function(e) {
            getKeyDown(e), 104 != e.which && 72 != e.which || toggleConsole();
        };
    }, getKeyDown = function(e) {
        siteCore.apps.debugConsole.debugValue("key-down", e.which);
    }, buildConsole = function() {
        $("body").append("<div id='debug-console'>Press H to toggle in window debug console<div id='debug-feed'></div><div id='debug-static-values'></div></div>");
    }, createValue = function($valueName) {
        $el.debugStaticValues.append("<div id='" + $valueName + "'>" + $valueName + ": <span class='value'></span></div>");
    }, styleConsole = function() {
        $el.debugConsole.css({
            color: "white",
            background: "black",
            border: "1px solid gray",
            position: "absolute",
            zIndex: "3000",
            fontSize: 9,
            padding: 10,
            maxHeight: 500,
            height: 350,
            width: 400,
            opacity: .65,
            top: 30,
            left: 10,
            display: "none"
        }), $el.debugFeed.css({
            background: "black",
            overflowY: "scroll",
            width: 200,
            paddingTop: 10,
            paddingBottom: 10,
            marginTop: 10
        }), $el.debugStaticValues.css({
            position: "absolute",
            top: 0,
            right: 0,
            width: 200,
            paddingTop: 10,
            paddingBottom: 10,
            marginTop: 10
        }), $el.debugConsole.css("font-family", '"Helvetica Neue", helvetica, arial, verdana, sans-serif');
    }, toggleConsole = function() {
        "block" == $el.debugConsole.css("display") ? (log("hidden"), $el.debugConsole.css({
            display: "none"
        }), $el.debugExtraElements.css({
            display: "none",
            opacity: 0
        })) : (log("activated"), $el.debugConsole.css({
            display: "block"
        }), $el.debugExtraElements.css({
            display: "block",
            opacity: 1
        }));
    }, debugConsole = function($data) {
        $el.debugFeed.prepend(consoleLine + " > " + $data + "<br />"), consoleLine++;
    }, debugValue = function($valueName, $data) {
        $el.debugStaticValues.find("#" + $valueName + " span.value").empty().append($data), 
        consoleLine++;
    }, cacheEl = function() {
        $el.debugConsole = $("#debug-console"), $el.debugFeed = $("#debug-feed"), $el.debugStaticValues = $("#debug-static-values"), 
        $el.debugExtraElements = $("#motion-control-helper");
    };
    return init(), {
        debugConsole: function($data) {
            debugConsole($data);
        },
        debugValue: function($valueName, $data) {
            debugValue($valueName, $data);
        }
    };
}

function mastheadUX() {
    var $el = {}, init = function() {
        cacheEl(), changeView("collapse"), $el.cta.playBtn.on("click", function() {
            playGame();
        }), $el.cta.options.on("click", function() {
            gamePaused ? siteCore.apps.viewAnimations.animateGameOptionsOut() : siteCore.apps.viewAnimations.animateGameOptionsIn();
        }), $el.cta.restart.on("click", function() {
            siteCore.apps.viewAnimations.animateRestart();
        }), $el.cta.endGame.on("click", function() {
            siteCore.apps.viewAnimations.animateEndGame();
        });
    }, changeView = function($viewName) {
        siteCore.apps.debugConsole.debugConsole("Changing View: " + $viewName), "collapse" == $viewName ? "init" == viewStatus ? (siteCore.apps.viewAnimations.animateStartUp(), 
        viewStatus = "instructions") : siteCore.apps.viewAnimations.animateCollapse() : "expand" == $viewName ? (siteCore.apps.viewAnimations.animateExpand(), 
        siteCore.apps.debugConsole.debugConsole("Expanding")) : "expand-complete" == $viewName && ("instructions" == viewStatus ? cameraAvailable ? (siteCore.apps.viewAnimations.animateInstructions("#allow-camera"), 
        checkCameraStatus()) : siteCore.apps.viewAnimations.animateInstructions("#how-to-play-keyboard") : "play" == viewStatus && siteCore.apps.viewAnimations.animateGameOptionsIn(), 
        siteCore.apps.debugConsole.debugConsole("Expand-complete"));
    }, playGame = function() {
        viewStatus = "play", siteCore.apps.viewAnimations.animateGameStart();
    }, cacheEl = function() {
        $el.cta = {}, $el.cta.playBtn = $("#how-to-play-keyboard"), $el.cta.options = $("#hud-options, #resume"), 
        $el.cta.restart = $("#restart, #end-game-restart"), $el.cta.endGame = $("#end-game");
    };
    return init(), {
        changeView: function($viewName) {
            changeView($viewName);
        }
    };
}

function enablerInitHandler() {
    siteCoreInit(), InitMH();
}

function clickExpandCTA() {
    Enabler.requestExpand();
}

function clickCloseCTA() {
    Enabler.reportManualClose(), Enabler.requestCollapse();
}

function addListeners() {
    btnExpandCTA_dc.addEventListener("click", clickExpandCTA, !1), btnCloseCTA_dc.addEventListener("click", clickCloseCTA, !1), 
    Enabler.addEventListener(studio.events.StudioEvent.EXPAND_START, expandStart), Enabler.addEventListener(studio.events.StudioEvent.EXPAND_FINISH, expandFinish), 
    Enabler.addEventListener(studio.events.StudioEvent.COLLAPSE_START, collapseStart), 
    Enabler.addEventListener(studio.events.StudioEvent.COLLAPSE_FINISH, collapseFinish);
}

function expandStart() {
    Enabler.finishExpand();
}

function expandFinish() {
    panelExpanded = !0, siteCore.apps.mastheadUX.changeView("expand");
}

function collapseStart() {
    Enabler.finishCollapse();
}

function collapseFinish() {
    panelExpanded = !1, siteCore.apps.mastheadUX.changeView("collapse");
}

function InitMH() {
    Enabler.setExpandingPixelOffsets(0, 0, 970, 500), collapsed_panel = document.getElementById("collapsed-panel"), 
    btnExpandCTA_dc = document.getElementById("ctaExpand_dc"), expanded_panel = document.getElementById("expanded-panel"), 
    btnCloseCTA_dc = document.getElementById("ctaClose_dc"), addListeners(), document.getElementById("abarth-logo").addEventListener("click", bgExitHandler, !1), 
    document.getElementById("abarth-logo").addEventListener("click", bgExitHandler, !1);
}

function bgExitHandler(e) {
    Enabler.exit("Abarth Logo Exit"), panelExpanded && Enabler.requestCollapse();
}

function viewAnimations() {
    var $el = {}, timeLine = new TimelineLite(), init = function() {
        cacheEl();
    }, cacheEl = function() {
        $el.collapsed = {}, $el.collapsed.panel = $("#collapsed-panel"), $el.collapsed.tagLine = $("#tag-line"), 
        $el.collapsed.description = $("#description"), $el.collapsed.button = $("#ctaExpand_dc"), 
        $el.expanded = {}, $el.expanded.panel = $("#expanded-panel"), $el.expanded.game = $("#view-game"), 
        $el.expanded.gameHUD = $("#game-hud"), $el.expanded.gameHUDelements = $(".hud-item"), 
        $el.expanded.instructions = {}, $el.expanded.instructions.view = $("#view-instructions"), 
        $el.expanded.instructions.header = $("#how-to-play"), $el.expanded.instructions.instruction = $(".instructions"), 
        $el.expanded.instructions.cars = $(".car"), $el.expanded.instructions.carStraight = $("#car-straight"), 
        $el.expanded.instructions.carLeft = $("#car-left"), $el.expanded.instructions.carRight = $("#car-right"), 
        $el.expanded.instructions.gameOptionsHeader = $("#options-header"), $el.expanded.instructions.gameOptions = $("#options-screen"), 
        $el.expanded.instructions.gameOptionsCta = $(".options-cta"), $el.expanded.endGame = {}, 
        $el.expanded.endGame.view = $("#view-end-game"), $el.expanded.endGame.bg = $("#end-game-bg"), 
        $el.expanded.endGame.header = $("#end-game-header"), $el.expanded.endGame.logo = $("#end-game-logo"), 
        $el.expanded.endGame.cta = $("#end-game-cta"), $el.expanded.endGame.restart = $("#end-game-restart"), 
        $el.game = {}, $el.game.allRaceStarter = $(".race-starter"), $el.game.raceStarter = $("#race-starter"), 
        $el.game.ready = $("#ready"), $el.game.ready1 = $("#ready-1"), $el.game.ready2 = $("#ready-2"), 
        $el.game.ready3 = $("#ready-3"), $el.game.go = $("#go"), $el.abarthLogo = $("#abarth-logo"), 
        $el.mainPanel = $("#main-panel"), $el.motionControllerVideo = $("#inputVideo");
    }, setupCollapse = function() {
        $el.collapsed.panel.css({
            display: "block"
        }), $el.expanded.panel.css({
            display: "none"
        }), $el.collapsed.panel.css({
            opacity: 0
        }), $el.collapsed.tagLine.css({
            opacity: 0
        }), $el.collapsed.description.css({
            opacity: 0
        }), $el.collapsed.button.css({
            opacity: 0
        }), $el.abarthLogo.css({
            opacity: 0
        }), $el.motionControllerVideo.css({
            opacity: 0
        });
    }, setupExpanded = function() {
        $el.collapsed.panel.css({
            display: "none"
        }), $el.expanded.panel.css({
            display: "block",
            opacity: 1
        }), $el.expanded.gameHUDelements.css({
            display: "none",
            opacity: 0
        }), $el.expanded.gameHUD.css({
            opacity: 0
        }), $el.expanded.instructions.view.css({
            display: "block",
            opacity: 1
        }), $el.expanded.instructions.header.css({
            opacity: 0
        }), $el.expanded.instructions.instruction.css({
            display: "none",
            opacity: 0
        }), $el.expanded.instructions.cars.css({
            opacity: 0
        });
    }, setupGame = function() {
        $el.game.allRaceStarter.css({
            opacity: 0
        });
    }, setupGameOptionsIn = function() {
        $el.expanded.instructions.instruction.css({
            display: "none",
            opacity: 0
        }), $el.expanded.instructions.view.css({
            display: "block"
        }), $el.expanded.game.css({
            display: "block",
            opacity: 1
        }), $el.expanded.instructions.gameOptionsCta.css({
            opacity: 0
        });
    }, setupGameOptionsOut = function() {
        $el.game.allRaceStarter.css({
            opacity: 0
        });
    }, setupEndGame = function() {
        $el.expanded.endGame.view.css({
            display: "block",
            opacity: 1
        }), $el.expanded.endGame.bg.css({
            opacity: 0
        }), $el.expanded.endGame.header.css({
            opacity: 0
        }), $el.expanded.endGame.cta.css({
            opacity: 0
        }), $el.expanded.endGame.restart.css({
            opacity: 0
        });
    }, animateExpand = function() {
        timeLine.clear(), timeLine.to($el.collapsed.tagLine, anim_fast, {
            opacity: 0,
            scale: 1.1
        }), timeLine.to($el.collapsed.description, anim_fast, {
            opacity: 0,
            scale: 1.1
        }), timeLine.to($el.collapsed.button, anim_fast, {
            opacity: 0,
            scale: 1.1
        }), timeLine.to($el.collapsed.panel, anim_fast_x2, {
            opacity: 0,
            scale: 1.3
        }), timeLine.to($el.mainPanel, anim_fast_x2, {
            height: 500,
            onComplete: function() {
                setupExpanded(), siteCore.apps.mastheadUX.changeView("expand-complete");
            }
        });
    }, instructionsAnimatedIn = !1, motionInstructionsActive = !1, instructionsFinished = !1, motionInstructionsLeft = !0, animateInstructions = function($element) {
        timeLine.clear(), $el.expanded.game.css({
            display: "block"
        });
        var instructionContent = $($element);
        instructionContent.css({
            display: "block"
        }), timeLine.fromTo($el.expanded.game, anim_med_x2, {
            opacity: 0,
            scale: 1.5,
            y: "-15%"
        }, {
            opacity: 1,
            scale: 1.3,
            y: "0%"
        }), timeLine.fromTo($el.expanded.instructions.header, anim_fast_x2, {
            opacity: 0,
            scale: 1.5
        }, {
            opacity: 1,
            scale: 1
        }, "-=" + anim_med), timeLine.fromTo(instructionContent, anim_fast_x2, {
            opacity: 0
        }, {
            opacity: 1
        }, "-=" + anim_fast), "#move-left" != $element && "#move-right" != $element || timeLine.to($el.motionControllerVideo, anim_fast, {
            opacity: 1
        }), timeLine.fromTo($el.expanded.instructions.carStraight, anim_fast_x2, {
            opacity: 0
        }, {
            opacity: 1,
            onComplete: function() {
                instructionsAnimatedIn = !0, "#move-left" == $element && (motionInstructionsActive = !0);
            }
        }, "-=" + anim_fast);
    }, animateInstructionsUpdate = function($element) {
        if (!instructionsAnimatedIn) return void animateInstructions($element);
        timeLine.clear();
        var instructionContent = $($element);
        instructionContent.css({
            display: "block"
        }), timeLine.to($el.expanded.instructions.instruction, anim_fast, {
            opacity: 0
        }), timeLine.fromTo(instructionContent, anim_fast, {
            opacity: 0
        }, {
            opacity: 1,
            onComplete: function() {
                "#move-left" == $element && (timeLine.to($el.motionControllerVideo, anim_fast, {
                    opacity: 1
                }), motionInstructionsActive = !0);
            }
        });
    }, instructionsTester = function($direction) {
        !instructionsFinished && motionInstructionsActive && ("up" == $direction ? ($el.expanded.instructions.carStraight.css({
            opacity: 1
        }), $el.expanded.instructions.carLeft.css({
            opacity: 0
        }), $el.expanded.instructions.carRight.css({
            opacity: 0
        })) : "left" == $direction ? ($el.expanded.instructions.carStraight.css({
            opacity: 0
        }), $el.expanded.instructions.carLeft.css({
            opacity: 1
        }), $el.expanded.instructions.carRight.css({
            opacity: 0
        }), motionInstructionsLeft && (motionInstructionsLeft = !1, animateInstructionsUpdate("#move-right"))) : "right" == $direction && ($el.expanded.instructions.carStraight.css({
            opacity: 0
        }), $el.expanded.instructions.carLeft.css({
            opacity: 0
        }), $el.expanded.instructions.carRight.css({
            opacity: 1
        }), motionInstructionsLeft || (instructionsFinished = !0, motionInstructionsActive = !1, 
        animateGameStart())));
    }, animateGameOptionsIn = function() {
        pauseGame(!0), setupGameOptionsIn(), timeLine.clear(), $el.expanded.instructions.gameOptions.css({
            display: "block"
        }), timeLine.to([ $el.expanded.gameHUD, $el.motionControllerVideo ], anim_fast_x2, {
            opacity: 0
        }), timeLine.to($el.expanded.game, anim_fast_x2, {
            scale: 1.3,
            y: "0%"
        }, "-=" + anim_fast_x2), timeLine.to($el.expanded.instructions.view, anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast_x2), timeLine.to($el.expanded.instructions.gameOptionsHeader, anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast), timeLine.to($el.expanded.instructions.gameOptions, anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast), timeLine.to($el.expanded.instructions.gameOptionsCta, anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast);
    }, animateGameOptionsOut = function() {
        setupGameOptionsOut(), timeLine.clear(), timeLine.to([ $el.expanded.instructions.gameOptionsHeader, $el.expanded.instructions.gameOptionsCta, $el.expanded.instructions.gameOptions ], anim_fast, {
            opacity: 0,
            onComplete: function() {
                pauseGame(!1);
            }
        }), timeLine.to($el.expanded.instructions.view, anim_fast_x2, {
            opacity: 0,
            onComplete: function() {
                $el.expanded.instructions.view.css({
                    display: "none"
                }), $el.expanded.gameHUDelements.css({
                    display: "block"
                });
            }
        }), timeLine.to([ $el.expanded.gameHUD, $el.expanded.gameHUDelements ], anim_fast_x2, {
            opacity: 1,
            scale: 1
        }, "-=" + anim_fast_x2), timeLine.to($el.motionControllerVideo, anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast_x2), timeLine.to($el.expanded.game, anim_fast_x2, {
            scale: 1,
            y: "0%"
        }, "-=" + anim_fast_x2), raceStarted || raceStartLights();
    }, animateGameStart = function() {
        viewStatus = "play", timeLine.clear(), setupGame(), resetPlayerPosition(), timeLine.to([ $el.expanded.instructions.instruction, $el.expanded.instructions.cars, $el.expanded.instructions.header ], anim_fast_x2, {
            opacity: 0,
            onComplete: function() {
                $el.expanded.instructions.view.css({
                    display: "none"
                });
            }
        }), timeLine.to($el.expanded.game, anim_fast_x2, {
            scale: 1
        }, "-=" + anim_med), timeLine.to([ $el.expanded.gameHUD, $el.game.raceStarter ], anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast), timeLine.fromTo($el.expanded.gameHUDelements, anim_fast, {
            opacity: 0,
            scale: 1.5
        }, {
            opacity: 1,
            scale: 1
        }), raceStarted || raceStartLights();
    }, raceStartLights = function() {
        timeLine.to($el.game.ready, anim_fast, {
            opacity: 1
        }, "+=" + anim_fast_x2), timeLine.to($el.game.ready1, anim_fast, {
            opacity: 1
        }, "+=" + raceStarterTime), timeLine.to($el.game.ready2, anim_fast, {
            opacity: 1
        }, "+=" + raceStarterTime), timeLine.to($el.game.ready3, anim_fast, {
            opacity: 1
        }, "+=" + raceStarterTime), timeLine.to($el.game.go, anim_fast, {
            opacity: 1,
            onComplete: function() {
                $el.expanded.gameHUDelements.css({
                    display: "block"
                }), raceStarted = !0, playerInputStatus(!0);
            }
        }, "+=" + raceStarterTime), timeLine.to($el.game.allRaceStarter, anim_fast_x2, {
            opacity: 0,
            scale: 1.2
        }, "+=" + anim_med_x2);
    }, animateRestart = function() {
        playerInputStatus(!1), raceStarted = !1, gamePaused = !1, timeLine.clear(), timeLine.to($el.expanded.game, anim_fast_x2, {
            scale: 1.5,
            opacity: 0,
            onComplete: function() {
                resetPlayerPosition();
            }
        }), timeLine.to([ $el.expanded.endGame.view, $el.expanded.instructions.instruction, $el.expanded.instructions.cars, $el.expanded.instructions.header, $el.expanded.instructions.gameOptionsHeader ], anim_fast_x2, {
            opacity: 0,
            onComplete: function() {
                $el.expanded.instructions.view.css({
                    display: "none"
                }), $el.expanded.endGame.view.css({
                    display: "none"
                });
            }
        }, "-=" + anim_fast_x2), setupGame(), timeLine.to($el.abarthLogo, anim_fast_x2, {
            scale: .7,
            bottom: "0px",
            right: "0px"
        }), timeLine.to($el.expanded.game, anim_fast_x2, {
            scale: 1,
            opacity: 1
        }), timeLine.to($el.motionControllerVideo, anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast), timeLine.to([ $el.expanded.gameHUD, $el.game.raceStarter ], anim_fast_x2, {
            opacity: 1
        }, "-=" + anim_fast), timeLine.fromTo($el.expanded.gameHUDelements, anim_fast, {
            opacity: 0,
            scale: 1.5
        }, {
            opacity: 1,
            scale: 1
        }), raceStartLights();
    }, animateCollapse = function() {
        "play" == viewStatus && pauseGame(!0), timeLine.clear(), timeLine.to($el.expanded.game, anim_fast, {
            opacity: 0,
            scale: 1.3,
            y: "0%"
        }), timeLine.to([ $el.motionControllerVideo, $el.abarthLogo, $el.expanded.instructions.instruction, $el.expanded.instructions.header, $el.expanded.instructions.gameOptionsHeader ], anim_fast, {
            opacity: 0
        }, "-=" + anim_fast), timeLine.to($el.mainPanel, anim_fast_x2, {
            height: 250,
            onComplete: function() {
                animateStartUp();
            }
        });
    }, animateStartUp = function() {
        siteCore.apps.debugConsole.debugConsole("Start Up Animation"), setupCollapse(), 
        timeLine.clear();
        timeLine.fromTo($el.collapsed.panel, anim_med_x2, {
            opacity: 0,
            scale: 1.3
        }, {
            opacity: 1,
            scale: 1
        }), $el.abarthLogo.css({
            bottom: "0px",
            right: "0px"
        }), timeLine.fromTo($el.abarthLogo, anim_fast_x2, {
            opacity: 0,
            scale: .5
        }, {
            opacity: 1,
            scale: .6
        }, "-=" + anim_fast_x2), timeLine.fromTo($el.collapsed.tagLine, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        }), timeLine.fromTo($el.collapsed.description, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        }), timeLine.fromTo($el.collapsed.button, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        });
    }, animateEndGame = function() {
        playerInputStatus(!1), raceStarted = !1, gamePaused = !1, timeLine.clear(), setupEndGame(), 
        timeLine.to($el.expanded.game, anim_fast_x2, {
            scale: 1.5,
            opacity: 0,
            onComplete: function() {
                resetPlayerPosition();
            }
        }), timeLine.to([ $el.abarthLogo, $el.expanded.instructions.instruction, $el.expanded.instructions.cars, $el.expanded.instructions.header, $el.expanded.instructions.gameOptionsHeader ], anim_fast_x2, {
            opacity: 0,
            onComplete: function() {
                $el.expanded.instructions.view.css({
                    display: "none"
                });
            }
        }, "-=" + anim_fast_x2), timeLine.fromTo($el.expanded.endGame.bg, anim_med_x2, {
            opacity: 0,
            scale: 1.3
        }, {
            opacity: 1,
            scale: 1
        }), timeLine.fromTo($el.expanded.endGame.header, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        }, "-=" + anim_fast), timeLine.fromTo($el.expanded.endGame.cta, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        }, "-=" + anim_fast), $el.abarthLogo.css({
            bottom: "12px",
            right: "20px"
        }), timeLine.fromTo($el.abarthLogo, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        }, "-=" + anim_fast), timeLine.fromTo($el.expanded.endGame.restart, anim_fast_x2, {
            opacity: 0,
            scale: .9
        }, {
            opacity: 1,
            scale: 1
        }, "-=" + anim_fast);
    };
    return init(), {
        animateCollapse: function() {
            animateCollapse();
        },
        animateExpand: function() {
            animateExpand();
        },
        animateStartUp: function() {
            animateStartUp();
        },
        animateInstructions: function($element) {
            animateInstructions($element);
        },
        animateGameStart: function() {
            animateGameStart();
        },
        animateInstructionsUpdate: function($element) {
            animateInstructionsUpdate($element);
        },
        instructionsTester: function($direction) {
            instructionsTester($direction);
        },
        animateGameOptionsIn: function() {
            animateGameOptionsIn();
        },
        animateGameOptionsOut: function() {
            animateGameOptionsOut();
        },
        animateRestart: function() {
            animateRestart();
        },
        animateEndGame: function() {
            animateEndGame();
        }
    };
}

var waitTime_frame_1 = 4, waitTime_frame_2 = 4, anim_box_in = .65, anim_box_wait = .55, anim_sheen_move = .2, anim_sheen_wait = .1, anim_fast = .25, anim_fast_x2 = 2 * anim_fast, anim_fast_third = anim_fast / 3, anim_fast_half = anim_fast / 2, anim_fast_2_third = .66 * anim_fast, anim_med = .75, anim_med_x2 = 2 * anim_med, anim_slow = 3, anim_slow_x2 = 2 * anim_slow, bg_in = 9, bg_out = 9, bg_wait = 0, bg_full_length = bg_in + bg_out + bg_wait, raceStarterTime = .75, videoInput = document.getElementById("inputVideo"), ctracker = new clm.tracker();

ctracker.init(pModel), ctracker.start(videoInput), navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia, 
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

var cameraActive = !1, cameraAvailable = !1, motionTrackingActive = !0;

cameraAvailable = !!navigator.getUserMedia;

var debounce = 0, currentFrame = 0, centerLeft = 60, centerRight = 90, difference = 0, minMoveDistance = 1;

$right = $("#right-motion-area"), $center = $("#center-motion-area"), $left = $("#left-motion-area"), 
$motionLine = $("#motion-line"), $motionControlHelper = $("#motion-control-helper");

var Stats = function() {
    var startTime = Date.now(), prevTime = startTime, ms = 0, msMin = 1e3, msMax = 0, fps = 0, fpsMin = 1e3, fpsMax = 0, frames = 0, mode = 0, container = document.createElement("div");
    container.id = "stats", container.addEventListener("mousedown", function(event) {
        event.preventDefault(), setMode(++mode % 2);
    }, !1), container.style.cssText = "width:80px;opacity:0.9;cursor:pointer";
    var fpsDiv = document.createElement("div");
    fpsDiv.id = "fps", fpsDiv.style.cssText = "padding:0 0 3px 3px;text-align:left;background-color:#002", 
    container.appendChild(fpsDiv);
    var fpsText = document.createElement("div");
    fpsText.id = "fpsText", fpsText.style.cssText = "color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:bold;line-height:15px", 
    fpsText.innerHTML = "FPS", fpsDiv.appendChild(fpsText);
    var fpsGraph = document.createElement("div");
    for (fpsGraph.id = "fpsGraph", fpsGraph.style.cssText = "position:relative;width:74px;height:30px;background-color:#0ff", 
    fpsDiv.appendChild(fpsGraph); fpsGraph.children.length < 74; ) {
        var bar = document.createElement("span");
        bar.style.cssText = "width:1px;height:30px;float:left;background-color:#113", fpsGraph.appendChild(bar);
    }
    var msDiv = document.createElement("div");
    msDiv.id = "ms", msDiv.style.cssText = "padding:0 0 3px 3px;text-align:left;background-color:#020;display:none", 
    container.appendChild(msDiv);
    var msText = document.createElement("div");
    msText.id = "msText", msText.style.cssText = "color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px", 
    msText.innerHTML = "MS", msDiv.appendChild(msText);
    var msGraph = document.createElement("div");
    for (msGraph.id = "msGraph", msGraph.style.cssText = "position:relative;width:74px;height:30px;background-color:#0f0", 
    msDiv.appendChild(msGraph); msGraph.children.length < 74; ) {
        var bar = document.createElement("span");
        bar.style.cssText = "width:1px;height:30px;float:left;background-color:#131", msGraph.appendChild(bar);
    }
    var setMode = function(value) {
        switch (mode = value) {
          case 0:
            fpsDiv.style.display = "block", msDiv.style.display = "none";
            break;

          case 1:
            fpsDiv.style.display = "none", msDiv.style.display = "block";
        }
    }, updateGraph = function(dom, value) {
        var child = dom.appendChild(dom.firstChild);
        child.style.height = value + "px";
    };
    return {
        domElement: container,
        setMode: setMode,
        current: function() {
            return fps;
        },
        begin: function() {
            startTime = Date.now();
        },
        end: function() {
            var time = Date.now();
            return ms = time - startTime, msMin = Math.min(msMin, ms), msMax = Math.max(msMax, ms), 
            msText.textContent = ms + " MS (" + msMin + "-" + msMax + ")", updateGraph(msGraph, Math.min(30, 30 - ms / 200 * 30)), 
            frames++, time > prevTime + 1e3 && (fps = Math.round(1e3 * frames / (time - prevTime)), 
            fpsMin = Math.min(fpsMin, fps), fpsMax = Math.max(fpsMax, fps), fpsText.textContent = fps + " FPS (" + fpsMin + "-" + fpsMax + ")", 
            updateGraph(fpsGraph, Math.min(30, 30 - fps / 100 * 30)), prevTime = time, frames = 0), 
            time;
        },
        update: function() {
            startTime = this.end();
        }
    };
}, frameNo = 0, firstFrame = !0, keyDown = !1, Dom = {
    get: function(id) {
        return id instanceof HTMLElement || id === document ? id : document.getElementById(id);
    },
    set: function(id, html) {
        Dom.get(id).innerHTML = html;
    },
    on: function(ele, type, fn, capture) {
        Dom.get(ele).addEventListener(type, fn, capture);
    },
    un: function(ele, type, fn, capture) {
        Dom.get(ele).removeEventListener(type, fn, capture);
    },
    show: function(ele, type) {
        Dom.get(ele).style.display = type || "block";
    },
    blur: function(ev) {
        ev.target.blur();
    },
    addClassName: function(ele, name) {
        Dom.toggleClassName(ele, name, !0);
    },
    removeClassName: function(ele, name) {
        Dom.toggleClassName(ele, name, !1);
    },
    toggleClassName: function(ele, name, on) {
        ele = Dom.get(ele);
        var classes = ele.className.split(" "), n = classes.indexOf(name);
        on = "undefined" == typeof on ? 0 > n : on, on && 0 > n ? classes.push(name) : !on && n >= 0 && classes.splice(n, 1), 
        ele.className = classes.join(" ");
    },
    storage: {}
}, Util = {
    timestamp: function() {
        return new Date().getTime();
    },
    toInt: function(obj, def) {
        if (null !== obj) {
            var x = parseInt(obj, 10);
            if (!isNaN(x)) return x;
        }
        return Util.toInt(def, 0);
    },
    toFloat: function(obj, def) {
        if (null !== obj) {
            var x = parseFloat(obj);
            if (!isNaN(x)) return x;
        }
        return Util.toFloat(def, 0);
    },
    limit: function(value, min, max) {
        return Math.max(min, Math.min(value, max));
    },
    randomInt: function(min, max) {
        return Math.round(Util.interpolate(min, max, Math.random()));
    },
    randomChoice: function(options) {
        return options[Util.randomInt(0, options.length - 1)];
    },
    percentRemaining: function(n, total) {
        return n % total / total;
    },
    accelerate: function(v, accel, dt) {
        return v + accel * dt;
    },
    interpolate: function(a, b, percent) {
        return a + (b - a) * percent;
    },
    easeIn: function(a, b, percent) {
        return a + (b - a) * Math.pow(percent, 2);
    },
    easeOut: function(a, b, percent) {
        return a + (b - a) * (1 - Math.pow(1 - percent, 2));
    },
    easeInOut: function(a, b, percent) {
        return a + (b - a) * (-Math.cos(percent * Math.PI) / 2 + .5);
    },
    exponentialFog: function(distance, density) {
        return 1 / Math.pow(Math.E, distance * distance * density);
    },
    increase: function(start, increment, max) {
        for (var result = start + increment; result >= max; ) result -= max;
        for (;0 > result; ) result += max;
        return result;
    },
    project: function(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
        p.camera.x = (p.world.x || 0) - cameraX, p.camera.y = (p.world.y || 0) - cameraY, 
        p.camera.z = (p.world.z || 0) - cameraZ, p.screen.scale = cameraDepth / p.camera.z, 
        p.screen.x = Math.round(width / 2 + p.screen.scale * p.camera.x * width / 2), p.screen.y = Math.round(height / 2 - p.screen.scale * p.camera.y * height / 2), 
        p.screen.w = Math.round(p.screen.scale * roadWidth * width / 2);
    },
    overlap: function(x1, w1, x2, w2, percent) {
        var half = (percent || 1) / 2, min1 = x1 - w1 * half, max1 = x1 + w1 * half, min2 = x2 - w2 * half, max2 = x2 + w2 * half;
        return !(min2 > max1 || min1 > max2);
    }
};

window.requestAnimationFrame || (window.requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
    window.setTimeout(callback, 1e3 / 60);
});

var Game = {
    run: function(options) {
        Game.loadImages(options.images, function(images) {
            function frame() {
                if (!gamePaused) {
                    for (firstFrame && (debug && $("#fps").appendTo("#debug-console"), firstFrame = !1), 
                    now = Util.timestamp(), dt = Math.min(1, (now - last) / 1e3), gdt += dt; gdt > step; ) gdt -= step, 
                    update(step);
                    render(), debug && (siteCore.apps.debugConsole.debugValue("frames", frameNo++), 
                    siteCore.apps.debugConsole.debugValue("segments", segments.length), stats.update()), 
                    last = now;
                }
                requestAnimationFrame(frame, canvas);
            }
            options.ready(images), Game.setKeyListener(options.keys);
            var canvas = options.canvas, update = options.update, render = options.render, step = options.step, now = null, last = Util.timestamp(), dt = 0, gdt = 0, stats = options.stats;
            frame(), Game.playMusic();
        });
    },
    loadImages: function(names, callback) {
        for (var result = [], count = names.length, onload = function() {
            0 == --count && callback(result);
        }, n = 0; n < names.length; n++) {
            var name = names[n];
            result[n] = document.createElement("img"), Dom.on(result[n], "load", onload), result[n].src = "images/" + name + ".png";
        }
    },
    setKeyListener: function(keys) {
        var onkey = function(keyCode, mode) {
            var n, k;
            for (n = 0; n < keys.length; n++) k = keys[n], k.mode = k.mode || "up", (k.key == keyCode || k.keys && k.keys.indexOf(keyCode) >= 0) && k.mode == mode && k.action.call();
        };
        Dom.on(document, "keydown", function(ev) {
            playerInput && (keyDown = !0, onkey(ev.keyCode, "down"));
        }), Dom.on(document, "keyup", function(ev) {
            keyDown = !1, onkey(ev.keyCode, "up");
        });
    },
    stats: function(parentId, id) {
        var result = new Stats();
        return result.domElement.id = id || "stats", $("#" + parentId).append(result.domElement), 
        result;
    },
    playMusic: function() {}
}, Render = {
    polygon: function(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color, ctx.beginPath(), ctx.moveTo(x1, y1), ctx.lineTo(x2, y2), 
        ctx.lineTo(x3, y3), ctx.lineTo(x4, y4), ctx.closePath(), ctx.fill();
    },
    segment: function(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {
        var lanew1, lanew2, lanex1, lanex2, lane, r1 = Render.rumbleWidth(w1, lanes), r2 = Render.rumbleWidth(w2, lanes), l1 = Render.laneMarkerWidth(w1, lanes), l2 = Render.laneMarkerWidth(w2, lanes);
        if (ctx.fillStyle = color.grass, ctx.fillRect(0, y2, width, y1 - y2), Render.polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble), 
        Render.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble), 
        Render.polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road), 
        color.lane) for (lanew1 = 2 * w1 / lanes, lanew2 = 2 * w2 / lanes, lanex1 = x1 - w1 + lanew1, 
        lanex2 = x2 - w2 + lanew2, lane = 1; lanes > lane; lanex1 += lanew1, lanex2 += lanew2, 
        lane++) Render.polygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
        Render.fog(ctx, 0, y1, width, y2 - y1, fog);
    },
    background: function(ctx, background, width, height, layer, rotation, offset) {
        rotation = rotation || 0, offset = offset || 0;
        var imageW = layer.w / 2, imageH = layer.h, sourceX = layer.x + Math.floor(layer.w * rotation), sourceY = layer.y, sourceW = Math.min(imageW, layer.x + layer.w - sourceX), sourceH = imageH, destX = 0, destY = offset, destW = Math.floor(width * (sourceW / imageW)), destH = height;
        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH), 
        imageW > sourceW && ctx.drawImage(background, layer.x, sourceY, imageW - sourceW, sourceH, destW - 1, destY, width - destW, destH);
    },
    sprite: function(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
        var destW = sprite.w * scale * width / 2 * (SPRITES.SCALE * roadWidth), destH = sprite.h * scale * width / 2 * (SPRITES.SCALE * roadWidth);
        destX += destW * (offsetX || 0), destY += destH * (offsetY || 0);
        var clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
        destH > clipH && ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - sprite.h * clipH / destH, destX, destY, destW, destH - clipH);
    },
    player: function(ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {
        var sprite, bounce = 1.5 * Math.random() * speedPercent * resolution * Util.randomChoice([ -1, 1 ]);
        sprite = 0 > steer ? updown > 0 ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT : steer > 0 ? updown > 0 ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT : updown > 0 ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT, 
        Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -.5, -1);
    },
    fog: function(ctx, x, y, width, height, fog) {
        1 > fog && (ctx.globalAlpha = 1 - fog, ctx.fillStyle = COLORS.FOG, ctx.fillRect(x, y, width, height), 
        ctx.globalAlpha = 1);
    },
    rumbleWidth: function(projectedRoadWidth, lanes) {
        return projectedRoadWidth / Math.max(6, 2 * lanes);
    },
    laneMarkerWidth: function(projectedRoadWidth, lanes) {
        return projectedRoadWidth / Math.max(32, 8 * lanes);
    }
}, KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    A: 65,
    D: 68,
    S: 83,
    W: 87
}, COLORS = {
    SKY: "#72D7EE",
    TREE: "#005108",
    FOG: "#54684c",
    LIGHT: {
        road: "#6b6b6b",
        grass: "#586d50",
        rumble: "#cccccc",
        lane: "#CCCCCC"
    },
    DARK: {
        road: "#696969",
        grass: "#53674b",
        rumble: "#cccccc"
    },
    START: {
        road: "white",
        grass: "white",
        rumble: "white"
    },
    FINISH: {
        road: "black",
        grass: "black",
        rumble: "black"
    }
}, BACKGROUND = {
    HILLS: {
        x: 5,
        y: 5,
        w: 1280,
        h: 480
    },
    SKY: {
        x: 5,
        y: 495,
        w: 1280,
        h: 480
    },
    TREES: {
        x: 5,
        y: 985,
        w: 1280,
        h: 480
    }
}, SPRITES = {
    PALM_TREE: {
        x: 5,
        y: 5,
        w: 215,
        h: 540
    },
    BILLBOARD08: {
        x: 230,
        y: 5,
        w: 385,
        h: 265
    },
    TREE1: {
        x: 625,
        y: 5,
        w: 360,
        h: 360
    },
    DEAD_TREE1: {
        x: 5,
        y: 555,
        w: 135,
        h: 332
    },
    BILLBOARD09: {
        x: 150,
        y: 555,
        w: 328,
        h: 282
    },
    BOULDER3: {
        x: 230,
        y: 280,
        w: 320,
        h: 220
    },
    COLUMN: {
        x: 995,
        y: 5,
        w: 200,
        h: 315
    },
    BILLBOARD01: {
        x: 625,
        y: 375,
        w: 300,
        h: 170
    },
    BILLBOARD06: {
        x: 488,
        y: 555,
        w: 298,
        h: 190
    },
    BILLBOARD05: {
        x: 5,
        y: 897,
        w: 298,
        h: 190
    },
    BILLBOARD07: {
        x: 313,
        y: 897,
        w: 298,
        h: 190
    },
    BOULDER2: {
        x: 621,
        y: 897,
        w: 298,
        h: 140
    },
    TREE2: {
        x: 1205,
        y: 5,
        w: 282,
        h: 295
    },
    BILLBOARD04: {
        x: 1205,
        y: 310,
        w: 268,
        h: 170
    },
    DEAD_TREE2: {
        x: 1205,
        y: 490,
        w: 150,
        h: 260
    },
    BOULDER1: {
        x: 1205,
        y: 760,
        w: 168,
        h: 248
    },
    BUSH1: {
        x: 5,
        y: 1097,
        w: 240,
        h: 155
    },
    CACTUS: {
        x: 929,
        y: 897,
        w: 235,
        h: 118
    },
    BUSH2: {
        x: 255,
        y: 1097,
        w: 232,
        h: 152
    },
    BILLBOARD03: {
        x: 5,
        y: 1262,
        w: 230,
        h: 220
    },
    BILLBOARD02: {
        x: 245,
        y: 1262,
        w: 215,
        h: 220
    },
    STUMP: {
        x: 995,
        y: 330,
        w: 195,
        h: 140
    },
    SEMI: {
        x: 1365,
        y: 490,
        w: 122,
        h: 144
    },
    TRUCK: {
        x: 1365,
        y: 644,
        w: 100,
        h: 78
    },
    CAR03: {
        x: 1383,
        y: 760,
        w: 88,
        h: 55
    },
    CAR02: {
        x: 1383,
        y: 825,
        w: 80,
        h: 59
    },
    CAR04: {
        x: 1383,
        y: 894,
        w: 80,
        h: 57
    },
    CAR01: {
        x: 1205,
        y: 1018,
        w: 80,
        h: 56
    },
    PLAYER_UPHILL_LEFT: {
        x: 1383,
        y: 961,
        w: 80,
        h: 45
    },
    PLAYER_UPHILL_STRAIGHT: {
        x: 1295,
        y: 1018,
        w: 80,
        h: 45
    },
    PLAYER_UPHILL_RIGHT: {
        x: 1385,
        y: 1018,
        w: 80,
        h: 45
    },
    PLAYER_LEFT: {
        x: 995,
        y: 480,
        w: 80,
        h: 41
    },
    PLAYER_STRAIGHT: {
        x: 1085,
        y: 480,
        w: 80,
        h: 41
    },
    PLAYER_RIGHT: {
        x: 995,
        y: 531,
        w: 80,
        h: 41
    }
};

SPRITES.SCALE = .3 * (1 / SPRITES.PLAYER_STRAIGHT.w), SPRITES.BILLBOARDS = [ SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09 ], 
SPRITES.PLANTS = [ SPRITES.TREE1, SPRITES.TREE2, SPRITES.DEAD_TREE1, SPRITES.DEAD_TREE2, SPRITES.PALM_TREE, SPRITES.BUSH1, SPRITES.BUSH2, SPRITES.CACTUS, SPRITES.STUMP, SPRITES.BOULDER1, SPRITES.BOULDER2, SPRITES.BOULDER3 ], 
SPRITES.CARS = [ SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.SEMI, SPRITES.TRUCK ];

var playerInput = !1, fps = 60, step = 1 / fps, width = 970, height = 500, centrifugal = .4, offRoadDecel = .99, skySpeed = .001, hillSpeed = .002, treeSpeed = .003, skyOffset = 0, hillOffset = 0, treeOffset = 0, segments = [], cars = [], stats = Game.stats("fps"), canvas = Dom.get("canvas"), ctx = canvas.getContext("2d"), background = null, sprites = null, resolution = null, roadWidth = 2e3, segmentLength = 200, rumbleLength = 3, trackLength = null, lanes = 3, fieldOfView = 100, cameraHeight = 1e3, cameraDepth = null, drawDistance = 300, playerX = 0, playerZ = null, fogDensity = 5, position = 0, speed = 0, maxSpeed = segmentLength / step, accel = maxSpeed / 10, breaking = -maxSpeed, decel = -maxSpeed / 5, offRoadDecel = -maxSpeed / 1.5, offRoadLimit = maxSpeed / 4, totalCars = 10, currentLapTime = 0, lastLapTime = null, keyLeft = !1, keyRight = !1, keyFaster = !1, keySlower = !1, offRoadMinSpeed = maxSpeed / 10, turnSpeed = 0, motionControllerOutputValue = 0, hud = {
    speed: {
        value: null,
        dom: Dom.get("speed_value")
    },
    current_lap_time: {
        value: null,
        dom: Dom.get("current_lap_time_value")
    },
    last_lap_time: {
        value: null,
        dom: Dom.get("last_lap_time_value")
    },
    fast_lap_time: {
        value: null,
        dom: Dom.get("fast_lap_time_value")
    }
}, ROAD = {
    LENGTH: {
        NONE: 0,
        SHORT: 25,
        MEDIUM: 50,
        LONG: 100
    },
    HILL: {
        NONE: 0,
        LOW: 20,
        MEDIUM: 40,
        HIGH: 60
    },
    CURVE: {
        NONE: 0,
        EASY: 2,
        MEDIUM: 4,
        HARD: 6
    }
};

Game.run({
    canvas: canvas,
    render: render,
    update: update,
    stats: stats,
    step: step,
    images: [ "background", "sprites" ],
    keys: [ {
        keys: [ KEY.LEFT, KEY.A ],
        mode: "down",
        action: function() {
            keyRight = !1, keyLeft = !0;
        }
    }, {
        keys: [ KEY.RIGHT, KEY.D ],
        mode: "down",
        action: function() {
            keyLeft = !1, keyRight = !0;
        }
    }, {
        keys: [ KEY.UP, KEY.W ],
        mode: "down",
        action: function() {
            keyFaster = !0;
        }
    }, {
        keys: [ KEY.DOWN, KEY.S ],
        mode: "down",
        action: function() {
            keySlower = !0;
        }
    }, {
        keys: [ KEY.LEFT, KEY.A ],
        mode: "up",
        action: function() {
            keyRight = !1, keyLeft = !1;
        }
    }, {
        keys: [ KEY.RIGHT, KEY.D ],
        mode: "up",
        action: function() {
            keyLeft = !1, keyRight = !1;
        }
    }, {
        keys: [ KEY.UP, KEY.W ],
        mode: "up",
        action: function() {
            keyFaster = !1;
        }
    }, {
        keys: [ KEY.DOWN, KEY.S ],
        mode: "up",
        action: function() {
            keySlower = !1;
        }
    } ],
    ready: function(images) {
        background = images[0], sprites = images[1], reset(), Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180, 
        updateHud("fast_lap_time", formatTime(Util.toFloat(Dom.storage.fast_lap_time)));
    }
});

var raceStarted = !1, gamePaused = !1, siteCore = {};

siteCore.apps = {};

var debug = !0;

debug && (siteCore.apps.debugConsole = new debugConsole());

var viewStatus = "init", panelExpanded = !1, $mainPanel = $("#main-panel");

window.onload = function() {
    Enabler.isInitialized() ? enablerInitHandler() : Enabler.addEventListener(studio.events.StudioEvent.INIT, enablerInitHandler);
};

var collapsed_panel, btnExpandCTA_dc, expanded_panel, btnCloseCTA_dc;
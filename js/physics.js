// ============================================================
// physics.js - Matter.js 物理引擎封装（二级节点）
// 依赖三级节点：无
// ============================================================

const Physics = (() => {
  let engine, world, runner;
  const bodies = new Map(); // id -> body

  function init() {
    engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
    world  = engine.world;
  }

  function step(dt) {
    Matter.Engine.update(engine, dt);
  }

  // 创建圆形刚体（角色用）
  function addCircle(id, x, y, r, options = {}) {
    const body = Matter.Bodies.circle(x, y, r, {
      label: id,
      frictionAir: 0.15,
      restitution: 0.1,
      ...options,
    });
    Matter.World.add(world, body);
    bodies.set(id, body);
    return body;
  }

  // 创建矩形刚体（建筑/资源用）
  function addRect(id, x, y, w, h, options = {}) {
    const body = Matter.Bodies.rectangle(x + w/2, y + h/2, w, h, {
      label: id,
      isStatic: options.isStatic !== false,
      ...options,
    });
    Matter.World.add(world, body);
    bodies.set(id, body);
    return body;
  }

  // 移除刚体
  function remove(id) {
    const b = bodies.get(id);
    if (b) { Matter.World.remove(world, b); bodies.delete(id); }
  }

  // 施加速度（角色移动）
  function setVelocity(id, vx, vy) {
    const b = bodies.get(id);
    if (b) Matter.Body.setVelocity(b, { x: vx, y: vy });
  }

  // 施加冲量（击退）
  function applyImpulse(id, fx, fy) {
    const b = bodies.get(id);
    if (b) Matter.Body.applyForce(b, b.position, { x: fx, y: fy });
  }

  // 获取位置
  function getPos(id) {
    const b = bodies.get(id);
    return b ? { x: b.position.x, y: b.position.y } : null;
  }

  // 直接设置位置
  function setPos(id, x, y) {
    const b = bodies.get(id);
    if (b) Matter.Body.setPosition(b, { x, y });
  }

  // 碰撞事件监听
  function onCollision(callback) {
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => callback(pair.bodyA.label, pair.bodyB.label));
    });
  }

  // 获取所有body
  function getBody(id) { return bodies.get(id); }

  // 查询点附近的bodies
  function queryRegion(x, y, r) {
    const results = [];
    for (const [id, b] of bodies) {
      const dx = b.position.x - x, dy = b.position.y - y;
      if (dx*dx + dy*dy <= r*r) results.push({ id, body: b });
    }
    return results;
  }

  return { init, step, addCircle, addRect, remove, setVelocity, applyImpulse, getPos, setPos, onCollision, getBody, queryRegion };
})();

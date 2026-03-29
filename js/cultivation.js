// ============================================================
// cultivation.js - 功法修炼/门派养成（二级节点）
// 引用三级节点：data/skills.js
// ============================================================

const Cultivation = (() => {
  // 门派状态
  const sect = {
    id: null,
    name: null,
    level: 1,
    xp: 0,
    xpMax: 200,
    members: [],
    reputation: 0,
    rules: [],
    treasury: { spirit_stone: 0, gold: 0 },
  };

  // 修炼状态
  let cultivating = false;
  let cultivTimer  = 0;
  const TICK_MS    = C.CULTIVATE_TICK;

  function init() {}

  // 开始/停止修炼
  function toggleCultivate(player) {
    cultivating = !cultivating;
    if (cultivating) {
      Utils.notify(`开始修炼《${_getSkillName(player.cultSkillId)}》`, '#9c27b0');
    } else {
      Utils.notify('停止修炼', '#aaa');
    }
  }

  function _getSkillName(skillId) {
    return (SKILLS[skillId] || SKILLS[skillId?.toUpperCase()])?.name || skillId;
  }

  function _getSkillDef(skillId) {
    return SKILLS[skillId] || SKILLS[skillId?.toUpperCase()] || SKILLS.BASIC_QI;
  }

  // 主更新
  function update(dt, player, weatherCfg, spiritAtPos) {
    if (!cultivating) return;

    cultivTimer += dt;
    if (cultivTimer < TICK_MS) return;
    cultivTimer -= TICK_MS;

    _doTick(player, weatherCfg, spiritAtPos);
  }

  function _doTick(player, weatherCfg, spiritAtPos) {
    const skillDef = _getSkillDef(player.cultSkillId);
    if (!skillDef) return;

    // 修炼速度受多方因素影响
    let xpGain   = skillDef.xpPerTick || 1;
    let spiritGain = skillDef.spiritGain || 0.5;

    // 地形灵力加成
    xpGain    *= (1 + spiritAtPos);
    spiritGain *= (1 + spiritAtPos);

    // 天气加成
    xpGain    *= (weatherCfg.cultivateMul || 1);
    spiritGain *= (weatherCfg.spiritMul || 1);

    // 门派加成
    if (sect.id && skillDef.sect === sect.id) {
      xpGain    *= 1.3;
      spiritGain *= 1.3;
    }

    // 饥饿惩罚
    if (player.hunger < 30) { xpGain *= 0.5; spiritGain *= 0.5; }
    // 生病惩罚
    if (player.sick) { xpGain *= 0.3; spiritGain *= 0.3; }
    // 免疫力影响（代表体质）
    xpGain    *= (0.5 + player.immunity / 200);

    // 累计灵力总量
    player.spiritTotal = (player.spiritTotal || 0) + spiritGain;
    player.cultXp      = (player.cultXp || 0) + xpGain;
    player.spirit = Utils.clamp(player.spirit + spiritGain * 0.1, 0, player.spiritMax);

    // 境界突破检测
    _checkRealmBreakthrough(player);

    // 功法阶段突破
    _checkSkillStageBreakthrough(player, skillDef);

    // 门派经验
    if (sect.id) { _addSectXp(xpGain * 0.2); }

    Utils.addFloatingText(player.x, player.y - 30, `+${spiritGain.toFixed(1)} 灵气`, '#9c27b0', 12);
  }

  function _checkRealmBreakthrough(player) {
    const nextRealm = REALMS[player.realmIdx + 1];
    if (!nextRealm) return;
    if (player.spiritTotal >= nextRealm.spiritReq) {
      player.realmIdx++;
      const realm = REALMS[player.realmIdx];
      player.hpMax = realm.hpBase;
      player.hp    = Math.min(player.hp + realm.hpBase * 0.5, player.hpMax);
      player.spiritMax = C.PLAYER_SPIRIT_MAX + player.realmIdx * 50;
      Utils.notify(`✨突破境界：${realm.name}！`, '#ffd700', 6000);
      Utils.addFloatingText(player.x, player.y - 60, `境界突破！${realm.name}`, '#ffd700', 22);
    }
  }

  function _checkSkillStageBreakthrough(player, skillDef) {
    const stageXpNeeded = 100 * Math.pow(1.5, (player.cultStage || 1) - 1);
    if ((player.cultXp || 0) >= stageXpNeeded) {
      if ((player.cultStage || 1) < skillDef.maxStage) {
        player.cultXp -= stageXpNeeded;
        player.cultStage = (player.cultStage || 1) + 1;
        // 应用功法效果到玩家属性
        _applySkillEffects(player, skillDef);
        Utils.notify(`《${skillDef.name}》修至第${player.cultStage}层！`, '#ce93d8', 4000);
      }
    }
  }

  function _applySkillEffects(player, skillDef) {
    const eff = skillDef.effects || {};
    if (eff.hp_max)     player.hpMax    = Utils.clamp(player.hpMax + eff.hp_max, 100, 99999);
    if (eff.spirit_max) player.spiritMax= Utils.clamp(player.spiritMax + eff.spirit_max, 50, 99999);
    if (eff.atk)        player.atk      += eff.atk;
    if (eff.def)        player.def      += eff.def;
    if (eff.immunity)   player.immunity = Utils.clamp(player.immunity + eff.immunity, 0, player.immunityMax);
  }

  // 切换修炼功法
  function switchSkill(player, skillId) {
    const skill = _getSkillDef(skillId);
    if (!skill) return;
    // 门派限制
    if (skill.sect && sect.id !== skill.sect) {
      Utils.notify(`此功法为 ${C.SECTS[skill.sect]?.name} 专属！`, '#f44336');
      return;
    }
    player.cultSkillId = skillId;
    player.cultStage   = 1;
    player.cultXp      = 0;
    cultivating = false;
    Utils.notify(`切换功法：《${skill.name}》`, '#9c27b0');
  }

  // ── 门派系统 ───────────────────────────────────────────────
  function foundSect(player, sectId) {
    if (sect.id) { Utils.notify('已加入门派', '#f44336'); return; }
    const sectCfg = C.SECTS[sectId];
    if (!sectCfg) return;
    if (player.realmIdx < 2) { Utils.notify('需要筑基境方可创建门派', '#f44336'); return; }

    sect.id = sectId;
    sect.name = sectCfg.name;
    sect.level = 1;
    sect.xp = 0;
    sect.reputation = 10;
    player.sectId = sectId;

    if (!Building.hasBuildingType('sect_hall')) {
      Utils.notify(`加入 ${sectCfg.name}！请建造宗门大殿！`, '#ffd700', 5000);
    } else {
      Utils.notify(`${sectCfg.name} 正式成立！`, '#ffd700', 5000);
    }
  }

  function _addSectXp(amount) {
    sect.xp += amount;
    if (sect.xp >= sect.xpMax) {
      sect.xp -= sect.xpMax;
      sect.level++;
      sect.xpMax = Math.floor(sect.xpMax * 1.5);
      Utils.notify(`${sect.name} 晋升为 ${sect.level} 阶门派！`, '#ffd700', 5000);
    }
  }

  function recruitMember(npcId) {
    if (!sect.id) { Utils.notify('尚未建立门派', '#f44336'); return; }
    if (!Building.hasBuildingType('sect_hall')) { Utils.notify('需要先建造宗门大殿', '#f44336'); return; }
    if (sect.members.includes(npcId)) { Utils.notify('已是门派成员', '#aaa'); return; }
    sect.members.push(npcId);
    sect.reputation += 5;
    Utils.notify(`招募新弟子，门派现有 ${sect.members.length} 人`, '#8bc34a');
  }

  function getSect()       { return sect; }
  function isCultivating() { return cultivating; }
  function getRealm(idx)   { return REALMS[idx] || REALMS[0]; }
  function getAllRealms()   { return REALMS; }
  function getAllSkills()   { return SKILLS; }

  return {
    init, toggleCultivate, update, switchSkill,
    foundSect, recruitMember,
    getSect, isCultivating, getRealm, getAllRealms, getAllSkills,
  };
})();

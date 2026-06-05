import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import { UserRole } from "./entities/enums";
import { TunnelSection } from "./entities/TunnelSection";
import { Sensor } from "./entities/Sensor";
import { SensorType, SensorStatus } from "./entities/enums";
import { SensorThreshold } from "./entities/SensorThreshold";
import { AlarmLevel } from "./entities/enums";
import { Device } from "./entities/Device";
import { DeviceType, DeviceStatus } from "./entities/enums";
import { EmergencyPlan } from "./entities/EmergencyPlan";
import { ResourceAllocation } from "./entities/ResourceAllocation";
import { PipelineUnit } from "./entities/PipelineUnit";
import * as bcrypt from "bcryptjs";

dotenv.config();

async function initDatabase() {
  console.log("正在初始化数据库...");

  try {
    await AppDataSource.initialize();
    console.log("数据库连接成功");

    console.log("正在创建表结构...");
    await AppDataSource.synchronize(true);
    console.log("表结构创建完成");

    console.log("正在插入初始数据...");

    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash("123456", 10);

    const users = [
      {
        username: "admin",
        password: hashedPassword,
        realName: "系统管理员",
        phone: "13800000001",
        email: "admin@example.com",
        role: UserRole.ADMIN,
        department: "运维部",
      },
      {
        username: "supervisor",
        password: hashedPassword,
        realName: "张主管",
        phone: "13800000002",
        email: "supervisor@example.com",
        role: UserRole.MAINTENANCE_SUPERVISOR,
        department: "运维部",
        team: "一班",
      },
      {
        username: "worker1",
        password: hashedPassword,
        realName: "李师傅",
        phone: "13800000003",
        email: "worker1@example.com",
        role: UserRole.MAINTENANCE_WORKER,
        department: "运维部",
        team: "一班",
      },
      {
        username: "worker2",
        password: hashedPassword,
        realName: "王师傅",
        phone: "13800000004",
        email: "worker2@example.com",
        role: UserRole.MAINTENANCE_WORKER,
        department: "运维部",
        team: "二班",
      },
      {
        username: "inspector",
        password: hashedPassword,
        realName: "赵巡检",
        phone: "13800000005",
        email: "inspector@example.com",
        role: UserRole.INSPECTOR,
        department: "巡检部",
      },
      {
        username: "command",
        password: hashedPassword,
        realName: "指挥中心",
        phone: "13800000006",
        email: "command@example.com",
        role: UserRole.COMMAND_CENTER,
        department: "指挥中心",
      },
      {
        username: "pipeline_unit",
        password: hashedPassword,
        realName: "燃气公司",
        phone: "13800000007",
        email: "gas@company.com",
        role: UserRole.PIPELINE_UNIT,
        department: "管线单位",
      },
    ];

    for (const userData of users) {
      const existing = await userRepo.findOne({
        where: { username: userData.username },
      });
      if (!existing) {
        const user = userRepo.create(userData);
        await userRepo.save(user);
        console.log(`  创建用户: ${userData.username} (${userData.realName})`);
      }
    }

    const tunnelSectionRepo = AppDataSource.getRepository(TunnelSection);
    const sections = [
      {
        code: "TS-001",
        name: "中心大道段",
        length: 1500,
        width: 6.5,
        height: 4.2,
        startMileage: "K0+000",
        endMileage: "K1+500",
        location: "中心大道下方",
      },
      {
        code: "TS-002",
        name: "人民路段",
        length: 2000,
        width: 7.0,
        height: 4.5,
        startMileage: "K1+500",
        endMileage: "K3+500",
        location: "人民路下方",
      },
      {
        code: "TS-003",
        name: "建设路段",
        length: 1800,
        width: 6.0,
        height: 4.0,
        startMileage: "K3+500",
        endMileage: "K5+300",
        location: "建设路下方",
      },
    ];

    const savedSections: TunnelSection[] = [];
    for (const sectionData of sections) {
      const existing = await tunnelSectionRepo.findOne({
        where: { code: sectionData.code },
      });
      if (!existing) {
        const section = tunnelSectionRepo.create(sectionData);
        const saved = await tunnelSectionRepo.save(section);
        savedSections.push(saved);
        console.log(`  创建管廊段: ${sectionData.code} (${sectionData.name})`);
      } else {
        savedSections.push(existing);
      }
    }

    const sensorRepo = AppDataSource.getRepository(Sensor);
    const thresholdRepo = AppDataSource.getRepository(SensorThreshold);

    const sensorConfigs = [
      {
        code: "SEN-001-TEMP",
        name: "温度传感器-001",
        type: SensorType.TEMPERATURE,
        warningMax: 40,
        alarmMax: 50,
        installationPosition: "中心大道段K0+500",
      },
      {
        code: "SEN-002-HUM",
        name: "湿度传感器-001",
        type: SensorType.HUMIDITY,
        warningMax: 85,
        alarmMax: 95,
        installationPosition: "中心大道段K0+500",
      },
      {
        code: "SEN-003-CH4",
        name: "甲烷传感器-001",
        type: SensorType.GAS_CH4,
        warningMax: 1.0,
        alarmMax: 2.5,
        installationPosition: "中心大道段K1+000",
      },
      {
        code: "SEN-004-H2S",
        name: "硫化氢传感器-001",
        type: SensorType.GAS_H2S,
        warningMax: 10,
        alarmMax: 20,
        installationPosition: "中心大道段K1+000",
      },
      {
        code: "SEN-005-WATER",
        name: "水位传感器-001",
        type: SensorType.WATER_LEVEL,
        warningMax: 100,
        alarmMax: 200,
        installationPosition: "中心大道段K1+200集水井",
      },
      {
        code: "SEN-006-CO",
        name: "一氧化碳传感器-001",
        type: SensorType.GAS_CO,
        warningMax: 30,
        alarmMax: 50,
        installationPosition: "人民路段K2+000",
      },
      {
        code: "SEN-007-O2",
        name: "氧气传感器-001",
        type: SensorType.GAS_O2,
        warningMin: 19.5,
        alarmMin: 18,
        installationPosition: "人民路段K2+000",
      },
      {
        code: "SEN-008-SMOKE",
        name: "烟雾传感器-001",
        type: SensorType.SMOKE,
        warningMax: 5,
        alarmMax: 15,
        installationPosition: "人民路段K2+500",
      },
      {
        code: "SEN-009-VIB",
        name: "振动传感器-001",
        type: SensorType.VIBRATION,
        warningMax: 10,
        alarmMax: 25,
        installationPosition: "建设路段K4+000",
      },
    ];

    if (savedSections.length > 0) {
      for (const sensorData of sensorConfigs) {
        const existing = await sensorRepo.findOne({
          where: { code: sensorData.code },
        });
        if (!existing) {
          const sectionIndex = sensorConfigs.indexOf(sensorData) % savedSections.length;
          const sensor = sensorRepo.create({
            code: sensorData.code,
            name: sensorData.name,
            type: sensorData.type,
            status: SensorStatus.NORMAL,
            installationPosition: sensorData.installationPosition,
            tunnelSectionId: savedSections[sectionIndex].id,
            isActive: true,
            lastHeartbeat: new Date(),
          });
          const savedSensor = await sensorRepo.save(sensor);
          console.log(`  创建传感器: ${sensorData.code} (${sensorData.name})`);

          const threshold = thresholdRepo.create({
            sensorId: savedSensor.id,
            warningMin: (sensorData as any).warningMin || null,
            warningMax: (sensorData as any).warningMax || null,
            alarmMin: (sensorData as any).alarmMin || null,
            alarmMax: (sensorData as any).alarmMax || null,
            alarmLevel: AlarmLevel.MAJOR,
            isActive: true,
          });
          await thresholdRepo.save(threshold);
          console.log(`    设置阈值完成`);
        }
      }
    }

    const deviceRepo = AppDataSource.getRepository(Device);
    const deviceConfigs = [
      {
        code: "DEV-001-VENT",
        name: "通风机-001",
        type: DeviceType.VENTILATION,
        powerRating: 15.0,
        installationPosition: "中心大道段K0+300",
      },
      {
        code: "DEV-002-VENT",
        name: "通风机-002",
        type: DeviceType.VENTILATION,
        powerRating: 15.0,
        installationPosition: "中心大道段K1+200",
      },
      {
        code: "DEV-003-PUMP",
        name: "排水泵-001",
        type: DeviceType.PUMP,
        powerRating: 7.5,
        installationPosition: "中心大道段K1+200集水井",
      },
      {
        code: "DEV-004-LIGHT",
        name: "照明系统-001",
        type: DeviceType.LIGHTING,
        powerRating: 5.0,
        installationPosition: "中心大道段全线",
      },
      {
        code: "DEV-005-FIRE",
        name: "消防系统-001",
        type: DeviceType.FIRE_SUPPRESSION,
        powerRating: 10.0,
        installationPosition: "人民路段K2+000",
      },
      {
        code: "DEV-006-PUMP",
        name: "排水泵-002",
        type: DeviceType.PUMP,
        powerRating: 7.5,
        installationPosition: "人民路段K3+000集水井",
      },
      {
        code: "DEV-007-VENT",
        name: "通风机-003",
        type: DeviceType.VENTILATION,
        powerRating: 15.0,
        installationPosition: "建设路段K4+500",
      },
    ];

    if (savedSections.length > 0) {
      for (const deviceData of deviceConfigs) {
        const existing = await deviceRepo.findOne({
          where: { code: deviceData.code },
        });
        if (!existing) {
          const sectionIndex = deviceConfigs.indexOf(deviceData) % savedSections.length;
          const device = deviceRepo.create({
            ...deviceData,
            status: DeviceStatus.OFF,
            tunnelSectionId: savedSections[sectionIndex].id,
            isActive: true,
          });
          await deviceRepo.save(device);
          console.log(`  创建设备: ${deviceData.code} (${deviceData.name})`);
        }
      }
    }

    const emergencyPlanRepo = AppDataSource.getRepository(EmergencyPlan);
    const resourceRepo = AppDataSource.getRepository(ResourceAllocation);

    const emergencyPlans = [
      {
        name: "高水位应急处置预案",
        eventType: SensorType.WATER_LEVEL,
        severityLevel: AlarmLevel.CRITICAL,
        disposalProcedure: "1. 立即启动所有排水泵；2. 通知运维人员现场处置；3. 关闭相关区域电源；4. 监测水位变化",
        safetyPrecautions: "注意防触电、佩戴救生设备",
        resources: [
          { resourceType: "设备", resourceName: "移动排水泵", quantity: "2台", responsibleTeam: "运维一班" },
          { resourceType: "人员", resourceName: "应急处置小组", quantity: "5人", responsibleTeam: "应急队" },
          { resourceType: "物资", resourceName: "沙袋、防水布", quantity: "若干", responsibleTeam: "物资部" },
        ],
      },
      {
        name: "燃气泄漏应急处置预案",
        eventType: SensorType.GAS_CH4,
        severityLevel: AlarmLevel.CRITICAL,
        disposalProcedure: "1. 立即启动通风系统；2. 禁止明火和电气操作；3. 疏散人员；4. 通知燃气公司",
        safetyPrecautions: "佩戴防毒面具、使用防爆设备",
        resources: [
          { resourceType: "设备", resourceName: "防爆通风机", quantity: "3台", responsibleTeam: "运维二班" },
          { resourceType: "人员", resourceName: "燃气应急小组", quantity: "6人", responsibleTeam: "应急队" },
          { resourceType: "物资", resourceName: "燃气检测仪、防毒面具", quantity: "若干", responsibleTeam: "物资部" },
        ],
      },
      {
        name: "高温应急处置预案",
        eventType: SensorType.TEMPERATURE,
        severityLevel: AlarmLevel.MAJOR,
        disposalProcedure: "1. 启动全部通风设备；2. 检查设备运行状态；3. 必要时减少人员进入",
        safetyPrecautions: "注意防暑降温",
        resources: [
          { resourceType: "设备", resourceName: "工业风扇", quantity: "5台", responsibleTeam: "运维一班" },
          { resourceType: "物资", resourceName: "防暑药品、饮用水", quantity: "若干", responsibleTeam: "综合部" },
        ],
      },
      {
        name: "有毒气体超标应急预案",
        eventType: SensorType.GAS_H2S,
        severityLevel: AlarmLevel.CRITICAL,
        disposalProcedure: "1. 立即启动强排风；2. 人员撤离至上风处；3. 佩戴正压式呼吸器；4. 检测气体浓度",
        safetyPrecautions: "必须佩戴专业防护设备",
        resources: [
          { resourceType: "设备", resourceName: "正压式呼吸器", quantity: "10套", responsibleTeam: "安全部" },
          { resourceType: "人员", resourceName: "危化品处置小组", quantity: "4人", responsibleTeam: "应急队" },
        ],
      },
    ];

    for (const planData of emergencyPlans) {
      const existing = await emergencyPlanRepo.findOne({
        where: { name: planData.name },
      });
      if (!existing) {
        const plan = emergencyPlanRepo.create({
          name: planData.name,
          eventType: planData.eventType,
          severityLevel: planData.severityLevel,
          description: planData.name,
          disposalProcedure: planData.disposalProcedure,
          safetyPrecautions: planData.safetyPrecautions,
          isActive: true,
        });
        const savedPlan = await emergencyPlanRepo.save(plan);
        console.log(`  创建应急预案: ${planData.name}`);

        for (const res of planData.resources) {
          const resource = resourceRepo.create({
            emergencyPlanId: savedPlan.id,
            ...res,
            isActive: true,
          });
          await resourceRepo.save(resource);
        }
        console.log(`    配置资源调配完成`);
      }
    }

    const pipelineUnitRepo = AppDataSource.getRepository(PipelineUnit);
    const pipelineUnits = [
      {
        unitCode: "PU-001",
        unitName: "市燃气集团有限公司",
        legalPerson: "张三",
        contactPerson: "李四",
        contactPhone: "13900000001",
        email: "contact@gascorp.com",
        address: "市燃气大厦",
      },
      {
        unitCode: "PU-002",
        unitName: "市供水集团有限公司",
        legalPerson: "王五",
        contactPerson: "赵六",
        contactPhone: "13900000002",
        email: "contact@watercorp.com",
        address: "市供水大厦",
      },
      {
        unitCode: "PU-003",
        unitName: "市电力公司",
        legalPerson: "钱七",
        contactPerson: "孙八",
        contactPhone: "13900000003",
        email: "contact@powercorp.com",
        address: "市电力大厦",
      },
    ];

    for (const unitData of pipelineUnits) {
      const existing = await pipelineUnitRepo.findOne({
        where: { unitCode: unitData.unitCode },
      });
      if (!existing) {
        const unit = pipelineUnitRepo.create(unitData);
        await pipelineUnitRepo.save(unit);
        console.log(`  创建管线单位: ${unitData.unitCode} (${unitData.unitName})`);
      }
    }

    console.log("\n数据库初始化完成！");
    console.log("\n测试账号信息：");
    console.log("  管理员账号: admin / 123456");
    console.log("  主管账号: supervisor / 123456");
    console.log("  工人账号: worker1 / 123456");
    console.log("  巡检账号: inspector / 123456");
    console.log("  指挥中心: command / 123456");
    console.log("  管线单位: pipeline_unit / 123456");

    process.exit(0);
  } catch (error) {
    console.error("数据库初始化失败:", error);
    process.exit(1);
  }
}

initDatabase();

const { withXcodeProject } = require("expo/config-plugins");

module.exports = function removeSwiftUICore(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (!buildSettings || !buildSettings.OTHER_LDFLAGS) continue;

      const flags = buildSettings.OTHER_LDFLAGS;
      if (Array.isArray(flags)) {
        buildSettings.OTHER_LDFLAGS = flags.filter(
          (flag) => flag !== '"-weak_framework SwiftUICore"' && flag !== "-weak_framework SwiftUICore"
        );
      }
    }

    return config;
  });
};

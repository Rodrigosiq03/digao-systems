import { useMemo } from 'react';
import type {
  AuthorizationCapability,
  AuthorizationProfile,
  AuthorizationProfileCapability,
  AuthorizationSystem,
  AuthorizationUserProfile,
} from '@/domain/authorization';

export type UserSystemAccessView = {
  system: AuthorizationSystem;
  grantedProfiles: AuthorizationProfile[];
  availableProfiles: AuthorizationProfile[];
  hasAccess: boolean;
};

type Params = {
  systems: AuthorizationSystem[];
  capabilities: AuthorizationCapability[];
  profiles: AuthorizationProfile[];
  profileCapabilities: AuthorizationProfileCapability[];
  assignments: AuthorizationUserProfile[];
};

export const useUserSystemAccessView = ({
  systems,
  capabilities,
  profiles,
  profileCapabilities,
  assignments,
}: Params): UserSystemAccessView[] =>
  useMemo(() => {
    const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]));
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const assignedProfileIds = new Set(assignments.map((assignment) => assignment.profileId));

    const profileIdsBySystem = new Map<number, Set<number>>();
    for (const grant of profileCapabilities) {
      const capability = capabilityById.get(grant.capabilityId);
      if (!capability) {
        continue;
      }
      const set = profileIdsBySystem.get(capability.systemId) ?? new Set<number>();
      set.add(grant.profileId);
      profileIdsBySystem.set(capability.systemId, set);
    }

    return systems.map((system) => {
      const relatedProfileIds = Array.from(profileIdsBySystem.get(system.id) ?? []);
      const availableProfiles = relatedProfileIds
        .map((profileId) => profileById.get(profileId))
        .filter((profile): profile is AuthorizationProfile => Boolean(profile));
      const grantedProfiles = availableProfiles.filter((profile) => assignedProfileIds.has(profile.id));

      return {
        system,
        grantedProfiles,
        availableProfiles,
        hasAccess: grantedProfiles.length > 0,
      };
    });
  }, [assignments, capabilities, profileCapabilities, profiles, systems]);

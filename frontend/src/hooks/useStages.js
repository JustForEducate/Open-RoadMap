import { useMemo } from 'react';
import { useI18n } from '../context/I18nContext';
import { STAGE_DEFINITIONS } from '../stageDefinitions';

export function useStages() {
  const { t } = useI18n();
  return useMemo(
    () => STAGE_DEFINITIONS.map((s) => ({ ...s, name: t(`stage.${s.id}`) })),
    [t]
  );
}

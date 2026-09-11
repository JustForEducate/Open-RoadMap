import { useMemo } from 'react';
import { useI18n } from '../../../shared/context/I18nContext.jsx';
import { STAGE_DEFINITIONS } from '../stageDefinitions.js';

export function useStages() {
  const { t } = useI18n();
  return useMemo(
    () => STAGE_DEFINITIONS.map((s) => ({ ...s, name: t(`stage.${s.id}`) })),
    [t]
  );
}

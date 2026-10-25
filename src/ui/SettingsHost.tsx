import { useLang } from '../i18n';
import { useUi } from '../uiState';
import ControlEditor from './ControlEditor';
import SettingsSheet from './SettingsSheet';
import UpdateBanner from './UpdateBanner';

/** Screens that sit above every other screen: settings, the control editor and the "new version" notice. */
export default function SettingsHost() {
  useLang();
  const ui = useUi();
  return (
    <>
      {ui.settings && <SettingsSheet />}
      {ui.editing && <ControlEditor />}
      <UpdateBanner />
    </>
  );
}

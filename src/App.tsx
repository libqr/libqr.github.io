import { useRef, useEffect } from "react";
import { HashRouter as Router, Navigate, useRoutes, Outlet } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, Input, IconButton, Box, ClickAwayListener, MenuList, MenuItem, Popover } from "@mui/material";
import { QrCodeScanner, Share, Cameraswitch, ContentCopy, Download, Upload, KeyboardArrowLeft, KeyboardArrowRight, Camera, ContentPaste, HighlightOff, HourglassTop } from '@mui/icons-material';
import store, { observer } from './store'

const path = window.location.pathname;
['/scan'].includes(path) && (window.location.href = '/#' + path)
navigator.serviceWorker.addEventListener("message", ({ data }) => store.upload(data.files));

const Scan = () => {
  useEffect(store.scan, [])
  return <Box><video style={{ width: '100%' }} /></Box>
}

const QR = observer(() => {
  const { qrcode, qrindex, qrsrc } = store
  return qrsrc
    ? <><img style={{ width: '100%' }} src={qrsrc} />
      {qrcode.length > 1 && <Box display='flex' alignItems='center'>
        <IconButton disabled={qrindex < 1} children={<KeyboardArrowLeft color={qrindex < 1 ? "disabled" : "primary"} fontSize='large' />} onClick={() => store.setIndex(qrindex - 1)} />
        {qrindex + 1} / {qrcode.length}
        <IconButton disabled={qrindex + 2 > qrcode.length} children={<KeyboardArrowRight color={qrindex + 2 > qrcode.length ? "disabled" : "primary"} fontSize='large' />} onClick={() => store.setIndex(qrindex + 1)} />
      </Box>}</>
    : <QrCodeScanner color='disabled' />
})

const ShareList = observer(() => <>
  <IconButton onClick={(e: any) => store.toggleShare(e.currentTarget)} children={<Share color='primary' />} />
  <Popover open={Boolean(store.shareAnchor)} anchorEl={store.shareAnchor} onClose={() => store.toggleShare()} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} children={
    <ClickAwayListener onClickAway={() => store.toggleShare()} children={
      <MenuList autoFocusItem children={['text', 'file', 'files'].map((type) => <MenuItem key={'share' + type} onClick={() => store.share(type)} children={type} />)} />} />} />
</>)

const App = observer(() => {
  const { input, scanner, loading } = store
  return useRoutes([{
    path: '/', element:
      <Dialog open fullWidth>
        <DialogTitle display='flex' flexWrap="wrap" sx={{ pb: 0, px: 2 }}>
          <IconButton onClick={store.toggleScan} children={<Camera color={scanner ? 'secondary' : 'primary'} />} />
          {scanner && <IconButton onClick={store.switchScan} children={<Cameraswitch color='primary' />} />}
          <IconButton onClick={store.copy} children={<ContentCopy color='primary' />} />
          <IconButton component="label" children={<><Upload color='primary' /><input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={({ target }) => (store.upload(target.files ?? []), target.value = '')} /></>} />
          <IconButton onClick={store.download} children={<Download color='primary' />} />
          <ShareList />
        </DialogTitle>
        <DialogContent>
          <Input endAdornment={<IconButton sx={{ p: 0 }} onClick={input ? store.init : store.paste} children={input ? <HighlightOff /> : <ContentPaste />} />}
            fullWidth multiline maxRows={4} sx={{ mb: 2 }} value={input} placeholder={'context'} onChange={(e) => store.setInput(e.target.value)} />
          <Box sx={{ display: 'flex', flexDirection: "column", alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '1/1' }} children={loading ? <HourglassTop color="primary" /> : <Outlet />} />
        </DialogContent>
      </Dialog>,
    children: [
      { path: '', element: <QR /> },
      { path: 'scan', element: <Scan /> },
    ]
  },
  { path: '*', element: <Navigate to="/" /> },
  ])
})

export default () => <Router children={<App />} />
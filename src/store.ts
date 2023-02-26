export { observer } from 'mobx-react-lite';
import { makeAutoObservable, runInAction } from 'mobx';
import { BrowserQRCodeReader } from '@zxing/browser';
import { toDataURL } from 'qrcode';

class Store {
	qreader = new BrowserQRCodeReader(new Map().set(2, [11]), { delayBetweenScanAttempts: 100, delayBetweenScanSuccess: 100 })
	qrindex = 0
	qrcode = ['']
	qrdata = ['']
	qrsrc = ''
	input = ''
	shareAnchor: any
	loading = false
	scanner = false
	scanmode = 'environment'
	constructor() {
		makeAutoObservable(this);
	}
	set = (o: any) => {
		runInAction(() => Object.keys(o).forEach((k) => this[k] = o[k]))
	}
	init = (o = {}) => {
		this.set({ qrindex: 0, qrcode: [''], qrdata: [''], qrsrc: '', input: '', scanner: false, loading: false, ...o })
	}
	scan = () => {
		this.init({ scanner: true })
		const promise = this.qreader.decodeFromConstraints({ video: { facingMode: this.scanmode, width: 600, height: 600 } }, document.querySelector('video')!, (i: any) => i && (this.setInput(i.getText()), this.toggleScan(0)))
		return () => { promise.then((s) => s.stop()) }
	}
	setInput = (i: string) => {
		this.init({ input: i })
		if (i !== '') {
			const qrdata = i.match(/[^]{2048}|[^]+/g)!
			const qrcode = qrdata.map((v) => toDataURL(v, { margin: 1, scale: 16 }))
			Promise.all(qrcode).then((qrcode) => this.set({ qrcode, qrdata, qrsrc: qrcode[0] }))
		} else this.qrsrc = ''
	}
	setIndex = (i: number) => {
		this.set({ qrindex: i, qrsrc: this.qrcode[i], input: this.qrdata[i] })
	}
	toggleScan = (off?: any) => {
		if (off === 0 || this.scanner) (this.scanner = false, window.location.hash = '/')
		else (this.scanner = true, window.location.hash = '/scan')
	}
	switchScan = () => {
		Promise.resolve(window.location.hash = '/')
			.then(() => this.scanmode = this.scanmode === 'environment' ? 'user' : 'environment')
			.then(() => window.location.hash = '/scan')
	}
	toggleShare = (anchor = null) => {
		this.set({ shareAnchor: this.shareAnchor ? null : anchor })
	}
	copy = () => {
		navigator.clipboard.writeText(this.input)
	}
	paste = () => {
		navigator.clipboard.readText().then(this.setInput)
	}
	upload = (files: FileList | never[]) => {
		this.init()
		if (this.scanner) this.toggleScan()
		for (const file of files) {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (e: ProgressEvent) => Promise.resolve((e.target as FileReader).result as string).then((qrsrc) =>
				this.qreader.decodeFromImageUrl(qrsrc).then((d) => d.getText()).catch(() => 'invalid').then((input) => this.qrcode[0]
					? this.set({ qrcode: [...this.qrcode, qrsrc], qrdata: [...this.qrdata, input], qrsrc: this.qrcode[0], input: this.qrdata[0] })
					: this.set({ qrcode: [qrsrc], qrdata: [input], qrsrc, input })))
		}
	}
	download = () => {
		let a: HTMLAnchorElement | null = document.createElement("a")
		if (this.qrsrc) (a!.download = 'qrcode.png', a!.href = this.qrsrc, a!.click())
		a = null
	}
	__share__ = (src: string, index = 0) => {
		const [mime, data] = src.split(",")
		const bstr = Buffer.from(data, 'base64').toString('latin1')
		return new File([new Uint8Array(bstr.length).map((_, i) => bstr.charCodeAt(i))], `qrcode${index}.png`, { type: mime.match(/:(.*?);/)?.[1] })
	}
	share = (type: string) => {
		this.set({ shareAnchor: null })
		if (!this.qrsrc) return
		switch (type) {
			case 'text': return navigator.share({ text: this.input })
			case 'file': return navigator.share({ files: [this.__share__(this.qrsrc)] })
			case 'files': return navigator.share({ files: this.qrcode.map(this.__share__) })
			default: return
		}
	}
}
export default new Store();
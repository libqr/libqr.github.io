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
	video: any
	scanner = false
	scanmode = 'environment'

	constructor() {
		makeAutoObservable(this);
	}
	init = () => {
		runInAction(() => (this.qrindex = 0, this.qrcode = [''], this.qrdata = [''], this.qrsrc = this.input = ''))
	}
	scan = (video: HTMLVideoElement, facingMode: string) => {
		navigator.mediaDevices.getUserMedia({ video: { facingMode, width: 600, height: 600 } }).then((m) => {
			video.srcObject = m, video.play()
			this.qreader.decodeFromVideoElement(video, (i: any) => i && (this.setInput(i.getText()), this.toggleScan()))
		}).catch(() => runInAction(() => (this.input = 'Scanning device could not be found!', this.toggleScan())))
	}
	scaninit = ({ video }: { video: HTMLVideoElement }) => {
		this.scanner = true
		this.init()
		this.scan(this.video = video, this.scanmode)
		return () => this.video.srcObject?.getTracks()?.[0]?.stop()
	}
	setInput = (i: string) => {
		this.input = i, this.qrindex = 0
		if (i !== '') {
			const qrdata = i.match(/[^]{2048}|[^]+/g)!
			const qrcode = qrdata.map((v) => toDataURL(v, { margin: 0, scale: 16 }))
			Promise.all(qrcode).then((code) => runInAction(() => {
				this.qrcode = code, this.qrsrc = code[0], this.qrdata = qrdata
			}))
		} else this.qrsrc = ''
	}
	setIndex = (i: number) => {
		this.qrindex = i, this.qrsrc = this.qrcode[i], this.input = this.qrdata[i]
	}
	toggleScan = () => {
		window.location.hash = ((this.scanner = !this.scanner)) ? '/scan' : '/'
	}
	switchScan = () => {
		this.video.srcObject.getTracks()[0].stop()
		this.scan(this.video, this.scanmode = this.scanmode === 'environment' ? 'user' : 'environment')
	}
	copy = () => {
		navigator.clipboard.writeText(this.input)
	}
	paste = () => {
		navigator.clipboard.readText().then(this.setInput)
	}
	upload = (files: FileList | never[]) => {
		if (this.scanner) this.toggleScan()
		this.init()
		for (const file of files) {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = async (e: ProgressEvent) => {
				let img: any = document.createElement("img")
				img.src = (e.target as FileReader).result as string
				const decode = await this.qreader.decodeFromImageElement(img).then((d) => d.getText()).catch(() => 'invalid')
				runInAction(() => {
					if (this.qrcode[0]) this.qrdata.push(decode), this.qrcode.push(img.src)
					else this.qrdata = [decode], this.qrcode = [img.src]
					img = null, this.qrsrc = this.qrcode[0], this.input = this.qrdata[0]
				})
			}
		}
	}
	download = () => {
		if (!this.qrsrc) return
		const a = document.createElement("a")
		a.download = 'qrcode.png', a.href = this.qrsrc
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}
	share = (type: string) => {
		const O: any = {}
		switch (type) {
			case 'text':
				if (!this.input) return
				return navigator.share({ text: this.input })
			case 'file':
				if (!this.qrsrc) return
				[O.mime, O.data] = this.qrsrc.split(",")
				O.bstr = Buffer.from(O.data, 'base64').toString('latin1')
				return navigator.share({ files: [new File([new Uint8Array(O.bstr.length).map((_, i) => O.bstr.charCodeAt(i))], 'qrcode.png', { type: O.mime.match(/:(.*?);/)?.[1] })] })
			case 'files':
				if (!this.qrsrc) return
				O.files = this.qrcode.map((code, index) => {
					const [mime, data] = code.split(",")
					const bstr = Buffer.from(data, 'base64').toString('latin1')
					return new File([new Uint8Array(bstr.length).map((_, i) => bstr.charCodeAt(i))], `qrcode${index}.png`, { type: mime.match(/:(.*?);/)?.[1] })
				})
				return navigator.share({ files: O.files })
			default:
				return
		}
	}
}

export default new Store();
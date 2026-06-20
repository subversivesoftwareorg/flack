import Cocoa
import Sparkle

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    let updaterController = SPUStandardUpdaterController(
        startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil
    )

    func applicationDidFinishLaunching(_ notification: Notification) {
        addCheckForUpdatesMenuItem()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    @objc func showAboutPanel(_ sender: Any?) {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"

        let creditsString = """
        Poison the data. Protect your privacy.

        Flack floods tracking services with fake data, \
        making your real browsing activity harder to identify.

        Subversive Software builds tools that put power back in people's hands.

        © 2026 subversivesoftware.org
        """

        let credits = NSAttributedString(
            string: creditsString,
            attributes: [
                .font: NSFont.systemFont(ofSize: 11),
                .foregroundColor: NSColor.labelColor
            ]
        )

        NSApp.orderFrontStandardAboutPanel(options: [
            .applicationName: "Flack",
            .applicationVersion: version,
            .version: build,
            .credits: credits
        ])
    }

    private func addCheckForUpdatesMenuItem() {
        guard let appMenu = NSApp.mainMenu?.items.first?.submenu else { return }

        let updateItem = NSMenuItem(
            title: "Check for Updates…",
            action: #selector(SPUStandardUpdaterController.checkForUpdates(_:)),
            keyEquivalent: ""
        )
        updateItem.target = updaterController

        let aboutIndex = appMenu.indexOfItem(withTitle: "About Flack")
        if aboutIndex >= 0 {
            appMenu.insertItem(NSMenuItem.separator(), at: aboutIndex + 1)
            appMenu.insertItem(updateItem, at: aboutIndex + 2)
        }
    }
}

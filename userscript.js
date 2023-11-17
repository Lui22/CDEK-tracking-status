// ==UserScript==
// @name         CDEK tracking status
// @description  CDEK tracking status on the order card
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @author       Lev Rybalov
// @grant        none
// @match        https://www.cdek.ru/ru/cabinet/orders
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cdek.ru
// ==/UserScript==

document.onkeydown = function(e) {
    if(e.altKey) {
        switch (e.code) {
            case 'KeyQ':
                displayStatus()
                break
        }
    }
}

async function displayStatus() {
    const ordersListEl = document.querySelector('.order-wrapper')
    const orderElArray = ordersListEl.children
    for (const orderEl of orderElArray) {
        const statusEl = orderEl.querySelector('.status')
        resetStatus(statusEl)

        const orderNumberText = orderEl.querySelector('.number').innerText
        const orderNumber = orderNumberText.replace('№ ', '')

        const orderInfo = await getOrderInfo(orderNumber)
        const latestStatus = findLatestInfo(orderInfo)

        insertStatus(statusEl, latestStatus)
    }
}

async function getOrderInfo(orderNum) {
    const authData = JSON.parse(localStorage.getItem('vuex')).keycloak.keycloak
    const authToken = authData.access_token

    const req = await fetch(`https://www.cdek.ru/api-lkfl/tracing/trackInfo/${orderNum}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    if (!req.ok) {
        throw Error('No cdek api info')
    }

    const res = await req.json()
    return res.data;
}

function findLatestInfo(orderInfo) {
    for (const trackingStatusType of orderInfo.trackingDetails.reverse()) {
        if (!trackingStatusType.statuses) continue

        for (const trackingCity of trackingStatusType.statuses.reverse()) {
            if (!trackingCity.cityChangelist) continue

            return {
                cityName: trackingCity.city.name,
                status: lastEl(trackingCity.cityChangelist).name
            }
        }
    }
}

function insertStatus(statusEl, statusObj) {
    statusEl.innerHTML += `<br>${statusObj.cityName} — ${statusObj.status}`
}

function resetStatus(statusEl) {
    const initialHTML = statusEl.innerHTML.replace(/<br>.*/, '')
    statusEl.innerHTML = initialHTML
}

function lastEl(array) {
    return array[array.length - 1]
}

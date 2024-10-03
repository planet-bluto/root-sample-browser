export async function coolFetch(url: string, type: string = "json") {
    let final_result: any;

    let res = await fetch(url)

    if (res instanceof Response) {

        let methods = {
            "json": res.json.bind(res),
            "text": res.text.bind(res),
        }

        final_result = await methods[type as keyof typeof methods]()
    }

    return final_result
}